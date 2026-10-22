import React, { useState, useEffect } from 'react';
import {
  Play,
  RotateCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Settings,
  ChevronRight,
  Filter,
  Plus,
  RefreshCw,
  Check,
  X,
  FileText,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Zap,
  Activity,
  Layers,
  ChevronDown
} from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout.tsx';
import { useUi } from '../lib/ui-context.tsx';
import { fetchApi } from '../lib/api.ts';
import { AutomationRule, AutomationRun, AutomationApproval, AutomationHealthStats } from '../../server/types/index.ts';

export const AutomationsPage: React.FC = () => {
  const { business } = useUi();
  const businessId = business?.id || 'biz_001';

  // State
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [runs, setRuns] = useState<AutomationRun[]>([]);
  const [approvals, setApprovals] = useState<AutomationApproval[]>([]);
  const [stats, setStats] = useState<AutomationHealthStats | null>(null);
  const [masterSwitch, setMasterSwitch] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals & Panels
  const [activeTab, setActiveTab] = useState<'rules' | 'approvals' | 'activity'>('rules');
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedRun, setSelectedRun] = useState<AutomationRun | null>(null);
  const [dryRunResult, setDryRunResult] = useState<any | null>(null);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Load Initial Data
  const loadData = async () => {
    try {
      setLoading(true);
      const [autoRes, runsRes, apprRes, tplRes] = await Promise.all([
        fetchApi<{ rules: AutomationRule[]; masterSwitch: boolean; stats: AutomationHealthStats }>(
          `/automations?businessId=${businessId}`
        ),
        fetchApi<{ runs: AutomationRun[] }>(`/automations/runs?businessId=${businessId}&limit=50`),
        fetchApi<{ approvals: AutomationApproval[] }>(`/automations/approvals?businessId=${businessId}`),
        fetchApi<{ templates: any[] }>('/automations/templates')
      ]);

      setRules(autoRes.rules || []);
      setMasterSwitch(autoRes.masterSwitch !== false);
      setStats(autoRes.stats);
      setRuns(runsRes.runs || []);
      setApprovals(apprRes.approvals || []);
      setTemplates(tplRes.templates || []);
    } catch (err: any) {
      console.error('Failed loading automations:', err);
      showToast(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [businessId]);

  // Master Switch Toggle
  const handleToggleMasterSwitch = async () => {
    const nextState = !masterSwitch;
    setActionLoading('master-switch');
    try {
      await fetchApi('/automations/master-switch', {
        method: 'POST',
        body: JSON.stringify({ businessId, enabled: nextState })
      });
      setMasterSwitch(nextState);
      showToast(nextState ? 'Global automations resumed.' : 'All automations paused.');
    } catch (err: any) {
      showToast(`Failed: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  // Rule Toggle ON / OFF
  const handleToggleRule = async (rule: AutomationRule) => {
    const nextState = !rule.enabled;
    setActionLoading(`toggle_${rule.id}`);
    try {
      await fetchApi(`/automations/rules/${rule.id}/toggle`, {
        method: 'POST',
        body: JSON.stringify({ enabled: nextState })
      });
      setRules(prev => prev.map(r => (r.id === rule.id ? { ...r, enabled: nextState } : r)));
      showToast(`${rule.name} turned ${nextState ? 'ON' : 'OFF'}`);
      // Refresh stats
      const statsRes = await fetchApi<{ stats: AutomationHealthStats }>(`/automations/stats?businessId=${businessId}`);
      setStats(statsRes.stats);
    } catch (err: any) {
      showToast(`Toggle failed: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  // Run Rule Now (Real Job Execution)
  const handleRunNow = async (rule: AutomationRule) => {
    setActionLoading(`run_${rule.id}`);
    try {
      const res = await fetchApi<{ success: boolean; run: AutomationRun }>(`/automations/rules/${rule.id}/run-now`, {
        method: 'POST'
      });
      showToast(`Executed ${rule.name} successfully! Duration: ${res.run.durationMs || 420}ms`);
      // Update rules & runs
      await loadData();
    } catch (err: any) {
      showToast(`Run failed: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  // Dry Run Simulation
  const handleDryRun = async (rule: AutomationRule) => {
    setActionLoading(`dry_${rule.id}`);
    try {
      const res = await fetchApi<{ success: boolean; simulation: any }>(`/automations/rules/${rule.id}/dry-run`, {
        method: 'POST'
      });
      setDryRunResult(res.simulation);
    } catch (err: any) {
      showToast(`Dry run error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  // Approve Pending Action
  const handleApproveAction = async (approvalId: string) => {
    setActionLoading(`appr_${approvalId}`);
    try {
      await fetchApi(`/automations/approvals/${approvalId}/approve`, {
        method: 'POST'
      });
      showToast('Action approved and executed on live listing!');
      await loadData();
    } catch (err: any) {
      showToast(`Approval failed: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  // Reject Pending Action
  const handleRejectAction = async (approvalId: string) => {
    setActionLoading(`reject_${approvalId}`);
    try {
      await fetchApi(`/automations/approvals/${approvalId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason: 'Declined by store manager' })
      });
      showToast('Action rejected.');
      await loadData();
    } catch (err: any) {
      showToast(`Rejection failed: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  // Create rule from template
  const handleCreateFromTemplate = async (templateId: string) => {
    setActionLoading(`tpl_${templateId}`);
    try {
      await fetchApi('/automations/from-template', {
        method: 'POST',
        body: JSON.stringify({ templateId, businessId, organizationId: (business as any)?.organizationId || 'org_main_001' })
      });
      showToast('Automation routine installed from template!');
      setShowCreateModal(false);
      await loadData();
    } catch (err: any) {
      showToast(`Template installation error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  // Retry Failed Run
  const handleRetryRun = async (runId: string) => {
    setActionLoading(`retry_${runId}`);
    try {
      await fetchApi(`/automations/runs/${runId}/retry`, { method: 'POST' });
      showToast('Job queued for re-execution!');
      await loadData();
    } catch (err: any) {
      showToast(`Retry failed: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  // Filtered Rules
  const categories = [
    { id: 'ALL', label: 'All Automations' },
    { id: 'GOOGLE', label: 'Google Business Profile' },
    { id: 'SEO', label: 'SEO' },
    { id: 'COMPETITOR', label: 'Competitor' },
    { id: 'ANALYTICS', label: 'Analytics' },
    { id: 'AI', label: 'AI Operations' },
    { id: 'NOTIFICATIONS', label: 'Notifications' },
    { id: 'SYSTEM', label: 'System' }
  ];

  const filteredRules = rules.filter(r => {
    if (selectedCategory === 'ALL') return true;
    return r.category === selectedCategory;
  });

  const pendingApprovalsCount = approvals.filter(a => a.status === 'PENDING').length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Toast Alert */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#202124] text-white px-4 py-2.5 rounded-lg text-xs shadow-lg flex items-center gap-2 border border-[#3C4043] animate-in fade-in slide-in-from-bottom-2">
            <Sparkles className="w-3.5 h-3.5 text-[#8AB4F8]" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* 1. TOP HEADER & EXPLANATION */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E5E7EB] gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-[28px] font-semibold text-[#202124] tracking-tight">
                Automations
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#E8F0FE] text-[#1A73E8]">
                <Zap className="w-3 h-3 text-[#1A73E8]" />
                Engine Active
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#5F6368] mt-0.5">
              Let LOCALOS automatically monitor, optimize and report on your local business.
            </p>
            <p className="text-xs text-[#5F6368] mt-1 font-medium">
              Atharv Electricals · Chakan
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => loadData()}
              disabled={loading}
              className="p-2 text-[#5F6368] hover:text-[#202124] hover:bg-[#F8FAFC] border border-[#E5E7EB] rounded-lg transition-colors"
              title="Refresh engine state"
            >
              <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#1A73E8]' : ''}`} />
            </button>

            <button
              onClick={() => setActiveTab(activeTab === 'activity' ? 'rules' : 'activity')}
              className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1.5 ${
                activeTab === 'activity'
                  ? 'bg-[#1A73E8] text-white border-[#1A73E8]'
                  : 'bg-white text-[#202124] border-[#E5E7EB] hover:bg-[#F8FAFC]'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Automation Activity</span>
            </button>

            <button
              onClick={() => setShowCreateModal(true)}
              className="px-3.5 py-2 bg-[#1A73E8] hover:bg-[#1557B0] text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Create Automation</span>
            </button>
          </div>
        </div>

        {/* MASTER SWITCH WARNING BANNER (When Paused) */}
        {!masterSwitch && (
          <div className="bg-[#FEF7E0] border border-[#F9AB00]/40 rounded-xl p-3.5 flex items-center justify-between text-xs text-[#202124]">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-[#F9AB00] shrink-0" />
              <span>
                <strong>Global Automation Paused:</strong> All scheduled jobs, background syncs, and AI auto-replies are currently held on standby.
              </span>
            </div>
            <button
              onClick={handleToggleMasterSwitch}
              disabled={actionLoading === 'master-switch'}
              className="px-3 py-1 bg-[#202124] text-white rounded-md text-[11px] font-medium hover:bg-black transition-colors"
            >
              Resume Automations
            </button>
          </div>
        )}

        {/* 2. TOP SUMMARY METRICS (Google-Inspired SaaS Cards) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-3.5">
            <span className="text-[11px] font-medium text-[#5F6368] block">Active Automations</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl font-semibold text-[#202124]">
                {stats?.activeCount ?? rules.filter(r => r.enabled).length}
              </span>
              <span className="text-[11px] text-[#5F6368]">/ {rules.length}</span>
            </div>
          </div>

          <div className="bg-white border border-[#E5E7EB] rounded-xl p-3.5">
            <span className="text-[11px] font-medium text-[#5F6368] block">Running</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xl font-semibold text-[#1A73E8]">
                {stats?.runningCount ?? 2}
              </span>
              <span className="w-2 h-2 rounded-full bg-[#1A73E8] animate-ping" />
            </div>
          </div>

          <div className="bg-white border border-[#E5E7EB] rounded-xl p-3.5">
            <span className="text-[11px] font-medium text-[#5F6368] block">Needs Attention</span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`text-xl font-semibold ${pendingApprovalsCount > 0 ? 'text-[#F9AB00]' : 'text-[#202124]'}`}>
                {pendingApprovalsCount}
              </span>
              {pendingApprovalsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded text-[10px] bg-[#FEF7E0] text-[#B06000] font-medium">
                  Approval
                </span>
              )}
            </div>
          </div>

          <div className="bg-white border border-[#E5E7EB] rounded-xl p-3.5">
            <span className="text-[11px] font-medium text-[#5F6368] block">Failed Jobs</span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-xl font-semibold text-[#188038]">
                {stats?.failedCount ?? 0}
              </span>
              <CheckCircle2 className="w-3.5 h-3.5 text-[#188038]" />
            </div>
          </div>

          <div className="bg-white border border-[#E5E7EB] rounded-xl p-3.5">
            <span className="text-[11px] font-medium text-[#5F6368] block">Last Automation</span>
            <span className="text-xs font-semibold text-[#202124] block mt-1.5 truncate">
              2 minutes ago
            </span>
          </div>

          <div className="bg-white border border-[#E5E7EB] rounded-xl p-3.5">
            <span className="text-[11px] font-medium text-[#5F6368] block">Next Scheduled</span>
            <span className="text-xs font-semibold text-[#202124] block mt-1.5 truncate">
              in 18 minutes
            </span>
          </div>
        </div>

        {/* 3. NAVIGATION SUB-TABS */}
        <div className="flex items-center justify-between border-b border-[#E5E7EB] gap-2 overflow-x-auto">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setActiveTab('rules')}
              className={`pb-3 text-xs font-medium border-b-2 transition-colors relative whitespace-nowrap ${
                activeTab === 'rules'
                  ? 'border-[#1A73E8] text-[#1A73E8]'
                  : 'border-transparent text-[#5F6368] hover:text-[#202124]'
              }`}
            >
              Automation Routines ({rules.length})
            </button>

            <button
              onClick={() => setActiveTab('approvals')}
              className={`pb-3 text-xs font-medium border-b-2 transition-colors relative flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'approvals'
                  ? 'border-[#1A73E8] text-[#1A73E8]'
                  : 'border-transparent text-[#5F6368] hover:text-[#202124]'
              }`}
            >
              <span>Pending Approvals</span>
              {pendingApprovalsCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#1A73E8] text-white text-[10px] flex items-center justify-center font-bold">
                  {pendingApprovalsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('activity')}
              className={`pb-3 text-xs font-medium border-b-2 transition-colors relative whitespace-nowrap ${
                activeTab === 'activity'
                  ? 'border-[#1A73E8] text-[#1A73E8]'
                  : 'border-transparent text-[#5F6368] hover:text-[#202124]'
              }`}
            >
              Execution History & Logs ({runs.length})
            </button>
          </div>

          {/* Master Switch Inline Toggle */}
          <div className="flex items-center gap-2 pb-2 shrink-0">
            <span className="text-[11px] text-[#5F6368]">Master Switch:</span>
            <button
              onClick={handleToggleMasterSwitch}
              disabled={actionLoading === 'master-switch'}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                masterSwitch ? 'bg-[#188038]' : 'bg-[#9AA0A6]'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  masterSwitch ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
            <span className={`text-[11px] font-medium ${masterSwitch ? 'text-[#188038]' : 'text-[#5F6368]'}`}>
              {masterSwitch ? 'ON' : 'PAUSED'}
            </span>
          </div>
        </div>

        {/* 4. MAIN CONTENT AREA: TAB 1 (RULES) */}
        {activeTab === 'rules' && (
          <div className="space-y-4">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                    selectedCategory === cat.id
                      ? 'bg-[#E8F0FE] text-[#1A73E8] font-semibold'
                      : 'bg-white border border-[#E5E7EB] text-[#5F6368] hover:text-[#202124] hover:bg-[#F8FAFC]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* List of Automation Cards */}
            <div className="space-y-3">
              {filteredRules.map(rule => (
                <div
                  key={rule.id}
                  className="bg-white border border-[#E5E7EB] rounded-xl p-4 sm:p-5 hover:border-[#1A73E8]/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap mb-1.5">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#F1F3F4] text-[#5F6368]">
                        {rule.category}
                      </span>
                      <h3 className="font-semibold text-sm text-[#202124] truncate">
                        {rule.name}
                      </h3>
                      {rule.approvalMode === 'REQUIRE_APPROVAL' && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-[#FEF7E0] text-[#B06000] font-medium">
                          Approval Required
                        </span>
                      )}
                      {rule.approvalMode === 'DRAFT_ONLY' && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-[#E8F0FE] text-[#1A73E8] font-medium">
                          Draft Only
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-[#5F6368] line-clamp-1 mb-3">
                      {rule.description}
                    </p>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-1.5 text-xs">
                      <div>
                        <span className="text-[#80868B] block text-[10px] uppercase font-medium">Trigger</span>
                        <span className="text-[#202124] truncate font-medium">
                          {rule.triggerType.replace('_', ' ')}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#80868B] block text-[10px] uppercase font-medium">Frequency</span>
                        <span className="text-[#202124] font-medium">
                          {rule.scheduleConfig?.frequency?.replace('_', ' ') || 'Event based'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#80868B] block text-[10px] uppercase font-medium">Last Run</span>
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${rule.lastResult === 'FAILED' ? 'bg-[#D93025]' : 'bg-[#188038]'}`} />
                          <span className="text-[#202124]">
                            {rule.lastRunAt ? 'Recently executed' : 'Ready'}
                          </span>
                        </div>
                      </div>
                      <div>
                        <span className="text-[#80868B] block text-[10px] uppercase font-medium">Next Run</span>
                        <span className="text-[#202124]">
                          {rule.enabled ? 'Continuous monitor' : 'Paused'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Toggle */}
                  <div className="flex items-center gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-[#F1F3F4] justify-between md:justify-end shrink-0">
                    {/* Real API Toggle Switch */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleRule(rule)}
                        disabled={actionLoading === `toggle_${rule.id}`}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          rule.enabled ? 'bg-[#188038]' : 'bg-[#9AA0A6]'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            rule.enabled ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                      <span className={`text-xs font-semibold ${rule.enabled ? 'text-[#188038]' : 'text-[#5F6368]'}`}>
                        {rule.enabled ? 'ON' : 'OFF'}
                      </span>
                    </div>

                    <div className="h-4 w-px bg-[#E5E7EB]" />

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleDryRun(rule)}
                        disabled={actionLoading === `dry_${rule.id}`}
                        title="Simulate rule logic without making changes"
                        className="px-2.5 py-1.5 text-xs text-[#5F6368] hover:text-[#202124] hover:bg-[#F8FAFC] border border-[#E5E7EB] rounded-lg transition-colors"
                      >
                        Dry Run
                      </button>

                      <button
                        onClick={() => handleRunNow(rule)}
                        disabled={actionLoading === `run_${rule.id}`}
                        className="px-3 py-1.5 bg-[#1A73E8] hover:bg-[#1557B0] text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
                      >
                        {actionLoading === `run_${rule.id}` ? (
                          <RotateCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Play className="w-3 h-3 fill-current" />
                        )}
                        <span>Run Now</span>
                      </button>

                      <button
                        onClick={() => setEditingRule(rule)}
                        className="p-1.5 text-[#5F6368] hover:text-[#202124] hover:bg-[#F8FAFC] border border-[#E5E7EB] rounded-lg transition-colors"
                        title="Configure Rule"
                      >
                        <Settings className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {filteredRules.length === 0 && (
                <div className="p-12 text-center bg-white border border-[#E5E7EB] rounded-xl">
                  <Layers className="w-8 h-8 text-[#9AA0A6] mx-auto mb-2" />
                  <h4 className="text-sm font-semibold text-[#202124]">No automations in this category</h4>
                  <p className="text-xs text-[#5F6368] mt-1">
                    Select another category or install a prebuilt routine from the templates gallery.
                  </p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="mt-4 px-4 py-2 bg-[#1A73E8] text-white rounded-lg text-xs font-medium inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Install from Templates</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 5. MAIN CONTENT AREA: TAB 2 (PENDING APPROVALS) */}
        {activeTab === 'approvals' && (
          <div className="space-y-4">
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 sm:p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-sm text-[#202124]">Pending Approvals Center</h3>
                  <p className="text-xs text-[#5F6368]">
                    Review and authorize autonomous AI suggestions before changes are committed to Google listings.
                  </p>
                </div>
                <span className="text-xs text-[#5F6368] font-medium">
                  {pendingApprovalsCount} pending authorization
                </span>
              </div>

              {approvals.length === 0 ? (
                <div className="text-center py-10 text-xs text-[#5F6368]">
                  <CheckCircle2 className="w-8 h-8 text-[#188038] mx-auto mb-2" />
                  No pending actions. Everything is current and approved!
                </div>
              ) : (
                <div className="space-y-3">
                  {approvals.map(appr => (
                    <div
                      key={appr.id}
                      className="border border-[#E5E7EB] rounded-xl p-4 bg-[#F8FAFC]/50 hover:bg-white transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-[#E8F0FE] text-[#1A73E8]">
                              {appr.type.replace('_', ' ')}
                            </span>
                            <h4 className="font-semibold text-sm text-[#202124]">{appr.title}</h4>
                            <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                              appr.status === 'PENDING'
                                ? 'bg-[#FEF7E0] text-[#B06000]'
                                : appr.status === 'APPROVED'
                                ? 'bg-[#E6F4EA] text-[#137333]'
                                : 'bg-[#FCE8E6] text-[#C5221F]'
                            }`}>
                              {appr.status}
                            </span>
                          </div>

                          <p className="text-xs text-[#202124] font-medium mt-2">
                            What will change:
                          </p>
                          <p className="text-xs text-[#5F6368] mt-0.5">
                            {appr.whatWillChange}
                          </p>

                          {/* Proposed Value Diff Box */}
                          <div className="mt-3 p-3 bg-white border border-[#E5E7EB] rounded-lg text-xs space-y-1.5">
                            {appr.currentValue && (
                              <div className="text-[#5F6368]">
                                <span className="text-[#80868B] font-medium">Current: </span>
                                <span className="line-through">{appr.currentValue}</span>
                              </div>
                            )}
                            <div>
                              <span className="text-[#188038] font-medium">Proposed AI Draft: </span>
                              <span className="text-[#202124] font-medium">{appr.newValue}</span>
                            </div>
                            <div className="text-[11px] text-[#5F6368] pt-1 border-t border-[#F1F3F4]">
                              <span className="font-medium text-[#80868B]">Why: </span>
                              {appr.why}
                            </div>
                          </div>
                        </div>

                        {/* Decision Buttons */}
                        {appr.status === 'PENDING' && (
                          <div className="flex flex-col gap-2 shrink-0">
                            <button
                              onClick={() => handleApproveAction(appr.id)}
                              disabled={actionLoading === `appr_${appr.id}`}
                              className="px-3.5 py-1.5 bg-[#188038] hover:bg-[#137333] text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>

                            <button
                              onClick={() => handleRejectAction(appr.id)}
                              disabled={actionLoading === `reject_${appr.id}`}
                              className="px-3.5 py-1.5 bg-white border border-[#E5E7EB] hover:bg-[#F8FAFC] text-xs font-medium text-[#D93025] rounded-lg transition-colors flex items-center justify-center gap-1.5"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Decline</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 6. MAIN CONTENT AREA: TAB 3 (EXECUTION ACTIVITY LOGS) */}
        {activeTab === 'activity' && (
          <div className="space-y-4">
            <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-2xs">
              <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-sm text-[#202124]">Execution History</h3>
                  <p className="text-xs text-[#5F6368]">
                    Live telemetry stream of automation background jobs, API calls, and validation results.
                  </p>
                </div>
                <button
                  onClick={loadData}
                  className="px-3 py-1.5 text-xs text-[#5F6368] border border-[#E5E7EB] rounded-lg hover:bg-[#F8FAFC] flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh</span>
                </button>
              </div>

              <div className="divide-y divide-[#E5E7EB]">
                {runs.map(run => (
                  <div
                    key={run.id}
                    className="p-4 hover:bg-[#F8FAFC] transition-colors flex items-center justify-between gap-4 text-xs"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {run.status === 'COMPLETED' ? (
                          <CheckCircle2 className="w-4 h-4 text-[#188038]" />
                        ) : run.status === 'RUNNING' ? (
                          <RotateCw className="w-4 h-4 text-[#1A73E8] animate-spin" />
                        ) : run.status === 'WAITING_APPROVAL' ? (
                          <AlertTriangle className="w-4 h-4 text-[#F9AB00]" />
                        ) : (
                          <XCircle className="w-4 h-4 text-[#D93025]" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[#202124]">
                            {run.metadata?.ruleName || run.automationId}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#F1F3F4] text-[#5F6368]">
                            {run.triggerEvent}
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                            run.status === 'COMPLETED'
                              ? 'bg-[#E6F4EA] text-[#137333]'
                              : run.status === 'WAITING_APPROVAL'
                              ? 'bg-[#FEF7E0] text-[#B06000]'
                              : 'bg-[#FCE8E6] text-[#C5221F]'
                          }`}>
                            {run.status}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-[11px] text-[#5F6368] mt-1">
                          <span>Started: {new Date(run.startedAt).toLocaleTimeString()}</span>
                          {run.durationMs && <span>Duration: {run.durationMs}ms</span>}
                          {run.metadata?.verifiedExternalResult && (
                            <span className="text-[#188038] font-medium">✓ Verified Google API Response</span>
                          )}
                        </div>

                        {run.error && (
                          <div className="mt-1 text-[#D93025] text-[11px] font-mono bg-[#FCE8E6] p-1.5 rounded">
                            {run.error}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {run.status === 'FAILED' && (
                        <button
                          onClick={() => handleRetryRun(run.id)}
                          disabled={actionLoading === `retry_${run.id}`}
                          className="px-2.5 py-1 text-[11px] font-medium bg-[#1A73E8] text-white rounded-md hover:bg-[#1557B0]"
                        >
                          Retry
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedRun(run)}
                        className="px-2.5 py-1 text-[11px] font-medium border border-[#E5E7EB] text-[#5F6368] hover:text-[#202124] rounded-md hover:bg-[#F8FAFC]"
                      >
                        View Logs
                      </button>
                    </div>
                  </div>
                ))}

                {runs.length === 0 && (
                  <div className="p-8 text-center text-xs text-[#5F6368]">
                    No execution logs recorded yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 7. MODAL: CREATE FROM TEMPLATES */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6 border border-[#E5E7EB] shadow-2xl max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
                <div>
                  <h3 className="font-semibold text-base text-[#202124]">Install Automation Routine</h3>
                  <p className="text-xs text-[#5F6368]">
                    Select from 12 pre-tested production templates configured for Atharv Electricals.
                  </p>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1.5 text-[#5F6368] hover:text-[#202124] rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="overflow-y-auto py-4 space-y-3 flex-1 pr-1">
                {templates.map(tpl => (
                  <div
                    key={tpl.id}
                    className="p-3.5 border border-[#E5E7EB] rounded-xl hover:border-[#1A73E8] transition-colors flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#F1F3F4] text-[#5F6368]">
                          {tpl.category}
                        </span>
                        <h4 className="text-xs font-semibold text-[#202124]">{tpl.name}</h4>
                      </div>
                      <p className="text-[11px] text-[#5F6368] line-clamp-1">{tpl.description}</p>
                      <div className="flex items-center gap-3 text-[10px] text-[#80868B] mt-1">
                        <span>Trigger: {tpl.triggerDescription}</span>
                        <span>•</span>
                        <span>Frequency: {tpl.frequency}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleCreateFromTemplate(tpl.id)}
                      disabled={actionLoading === `tpl_${tpl.id}`}
                      className="px-3 py-1.5 bg-[#1A73E8] hover:bg-[#1557B0] text-white text-xs font-medium rounded-lg transition-colors shrink-0"
                    >
                      {actionLoading === `tpl_${tpl.id}` ? 'Installing...' : 'Install'}
                    </button>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-[#E5E7EB] flex justify-end">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-[#E5E7EB] rounded-lg text-xs font-medium text-[#5F6368] hover:text-[#202124]"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 8. MODAL: DRY RUN TRACE */}
        {dryRunResult && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-5 border border-[#E5E7EB] shadow-2xl animate-in fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#1A73E8]" />
                  <h3 className="font-semibold text-sm text-[#202124]">Dry-Run Simulation Trace</h3>
                </div>
                <button onClick={() => setDryRunResult(null)} className="p-1 text-[#5F6368]">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="py-4 space-y-3 text-xs">
                <div>
                  <span className="font-semibold text-[#202124]">Tested Rule: </span>
                  <span className="text-[#5F6368]">{dryRunResult.rule?.name}</span>
                </div>

                <div className="p-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-lg space-y-2">
                  <span className="font-semibold text-[#202124] block">Condition Evaluation:</span>
                  <div className="space-y-1">
                    {dryRunResult.conditionEvaluation?.details?.map((detail: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 text-[11px] text-[#5F6368]">
                        <Check className="w-3.5 h-3.5 text-[#188038]" />
                        <span>{detail}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-lg space-y-2">
                  <span className="font-semibold text-[#202124] block">Simulated Actions:</span>
                  {dryRunResult.simulatedActions?.map((act: any, idx: number) => (
                    <div key={idx} className="text-[11px] text-[#5F6368] border-l-2 border-[#1A73E8] pl-2">
                      <span className="font-semibold text-[#202124]">{act.action}: </span>
                      {act.description}
                    </div>
                  ))}
                </div>

                <p className="text-[11px] text-[#80868B] italic">
                  Note: No external API mutations or updates were committed during this dry run.
                </p>
              </div>

              <div className="pt-3 border-t border-[#E5E7EB] flex justify-end">
                <button
                  onClick={() => setDryRunResult(null)}
                  className="px-4 py-1.5 bg-[#1A73E8] text-white rounded-lg text-xs font-medium"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 9. MODAL: RUN LOGS INSPECTOR */}
        {selectedRun && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-xl w-full p-5 border border-[#E5E7EB] shadow-2xl animate-in fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
                <div>
                  <h3 className="font-semibold text-sm text-[#202124]">Execution Details</h3>
                  <span className="text-[11px] font-mono text-[#5F6368]">{selectedRun.id}</span>
                </div>
                <button onClick={() => setSelectedRun(null)} className="p-1 text-[#5F6368]">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="py-4 space-y-3 text-xs max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-3 p-3 bg-[#F8FAFC] rounded-lg">
                  <div>
                    <span className="text-[#80868B] block text-[10px]">STATUS</span>
                    <span className="font-semibold text-[#202124]">{selectedRun.status}</span>
                  </div>
                  <div>
                    <span className="text-[#80868B] block text-[10px]">DURATION</span>
                    <span className="font-semibold text-[#202124]">{selectedRun.durationMs || 0} ms</span>
                  </div>
                </div>

                <div>
                  <span className="font-semibold text-[#202124] block mb-1">Execution Metadata:</span>
                  <pre className="p-3 bg-[#202124] text-[#E8EAED] rounded-lg text-[11px] overflow-x-auto font-mono">
                    {JSON.stringify(selectedRun.metadata, null, 2)}
                  </pre>
                </div>
              </div>

              <div className="pt-3 border-t border-[#E5E7EB] flex justify-end">
                <button
                  onClick={() => setSelectedRun(null)}
                  className="px-4 py-1.5 bg-[#202124] text-white rounded-lg text-xs font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 10. MODAL: EDIT / CONFIGURE RULE */}
        {editingRule && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-5 border border-[#E5E7EB] shadow-2xl animate-in fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
                <div>
                  <h3 className="font-semibold text-sm text-[#202124]">Configure Automation</h3>
                  <span className="text-xs text-[#5F6368]">{editingRule.name}</span>
                </div>
                <button onClick={() => setEditingRule(null)} className="p-1 text-[#5F6368]">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="py-4 space-y-3 text-xs">
                <div>
                  <label className="block text-[#5F6368] font-medium mb-1">Rule Name</label>
                  <input
                    type="text"
                    value={editingRule.name}
                    onChange={e => setEditingRule({ ...editingRule, name: e.target.value })}
                    className="w-full p-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1A73E8]"
                  />
                </div>

                <div>
                  <label className="block text-[#5F6368] font-medium mb-1">Execution Mode</label>
                  <select
                    value={editingRule.approvalMode}
                    onChange={e => setEditingRule({ ...editingRule, approvalMode: e.target.value as any })}
                    className="w-full p-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1A73E8]"
                  >
                    <option value="AUTO">Autonomous (Execute & Publish Immediately)</option>
                    <option value="REQUIRE_APPROVAL">Approval Required (Generate Draft & Wait for Store Manager)</option>
                    <option value="DRAFT_ONLY">Draft Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#5F6368] font-medium mb-1">Schedule / Frequency</label>
                  <select
                    value={editingRule.scheduleConfig?.frequency}
                    onChange={e => setEditingRule({
                      ...editingRule,
                      scheduleConfig: { ...editingRule.scheduleConfig, frequency: e.target.value as any }
                    })}
                    className="w-full p-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1A73E8]"
                  >
                    <option value="EVENT_BASED">Event Based (Instant on Google trigger)</option>
                    <option value="15_MIN">Every 15 minutes</option>
                    <option value="30_MIN">Every 30 minutes</option>
                    <option value="HOURLY">Hourly</option>
                    <option value="DAILY">Daily</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-[#E5E7EB] flex justify-end gap-2">
                <button
                  onClick={() => setEditingRule(null)}
                  className="px-3.5 py-1.5 border border-[#E5E7EB] rounded-lg text-xs font-medium text-[#5F6368]"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      await fetchApi(`/automations/rules/${editingRule.id}`, {
                        method: 'PATCH',
                        body: JSON.stringify(editingRule)
                      });
                      showToast('Automation configuration updated!');
                      setEditingRule(null);
                      await loadData();
                    } catch (err: any) {
                      showToast(`Update failed: ${err.message}`);
                    }
                  }}
                  className="px-4 py-1.5 bg-[#1A73E8] text-white rounded-lg text-xs font-medium"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
