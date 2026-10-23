import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sliders,
  Server,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Cpu,
  Database,
  Save,
  Sparkles,
  AlertCircle,
  Key,
  Eye,
  EyeOff,
  CloudUpload,
  CloudDownload,
  Cloud,
  Check,
  FileCheck2,
  ExternalLink,
  Building2,
  AlertTriangle,
  HelpCircle,
  Clock,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';
import { freshTestApi } from '../../lib/fresh-test-api.ts';

export const SuperAdminSystemPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'compliance' | 'infrastructure'>('compliance');
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [newApiKey, setNewApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  // Gemini Provider Diagnostics
  const [geminiStatus, setGeminiStatus] = useState<any>(null);
  const [aiMetrics, setAiMetrics] = useState<any>(null);
  const [testingGemini, setTestingGemini] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  // Firebase DB Synchronization State
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [syncingFirebase, setSyncingFirebase] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);

  // Cashfree Compliance & Checklist State
  const [complianceSettings, setComplianceSettings] = useState<any>({
    brandName: 'Qorbiq AI',
    legalBusinessName: 'Qorbiq AI',
    supportEmail: 'support@qorbiq.ai',
    supportPhone: '+91 98765 43210',
    address: 'Level 4, Cyber City, Magarpatta',
    city: 'Pune',
    state: 'Maharashtra',
    pinCode: '411028',
    country: 'India',
    supportHours: 'Monday – Friday, 10:00 AM – 6:00 PM IST',
    websiteUrl: 'https://qorbiq.ai',
    gstin: '',
    taxApplicable: false
  });
  const [checklist, setChecklist] = useState<any>(null);
  const [savingCompliance, setSavingCompliance] = useState(false);
  const [complianceSavedSuccess, setComplianceSavedSuccess] = useState(false);
  const [checklistFilter, setChecklistFilter] = useState<'all' | 'legal' | 'pricing' | 'technical' | 'branding'>('all');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const [sysRes, geminiRes, metricsRes, syncRes, compRes, checkRes] = await Promise.allSettled([
        freshTestApi.getAdminSystem(),
        freshTestApi.getGeminiStatus(),
        freshTestApi.getAiObservabilityMetrics(),
        freshTestApi.getFirebaseSyncStatus(),
        freshTestApi.getAdminComplianceSettings(),
        freshTestApi.getAdminCashfreeReadinessChecklist()
      ]);
      if (sysRes.status === 'fulfilled') {
        setSettings(sysRes.value.settings);
      }
      if (geminiRes.status === 'fulfilled') {
        setGeminiStatus(geminiRes.value);
      }
      if (metricsRes.status === 'fulfilled') {
        setAiMetrics(metricsRes.value);
      }
      if (syncRes.status === 'fulfilled') {
        setSyncStatus(syncRes.value);
      }
      if (compRes.status === 'fulfilled' && compRes.value?.complianceSettings) {
        setComplianceSettings(compRes.value.complianceSettings);
      }
      if (checkRes.status === 'fulfilled' && checkRes.value?.checklist) {
        setChecklist(checkRes.value.checklist);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncFirebase = async (mode: 'push' | 'pull' = 'push') => {
    try {
      setSyncingFirebase(true);
      setSyncResult(null);
      const res = await freshTestApi.syncFirebaseDatabase(mode);
      setSyncResult(res);
      const updatedStatus = await freshTestApi.getFirebaseSyncStatus();
      setSyncStatus(updatedStatus);
    } catch (err: any) {
      setSyncResult({
        success: false,
        error: err.message || 'Firebase synchronization failed.'
      });
    } finally {
      setSyncingFirebase(false);
    }
  };

  const handleTestGemini = async () => {
    try {
      setTestingGemini(true);
      setTestResult(null);
      const res = await freshTestApi.testGeminiConnection();
      setTestResult(res);
      const updated = await freshTestApi.getGeminiStatus();
      setGeminiStatus(updated);
    } catch (err: any) {
      setTestResult({
        success: false,
        status: 'ERROR',
        latencyMs: 0,
        error: err.message || 'Connection test failed'
      });
    } finally {
      setTestingGemini(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload: any = { ...settings };
      if (newApiKey.trim()) {
        payload.geminiApiKey = newApiKey.trim();
      }
      const res = await freshTestApi.updateAdminSystem(payload);
      setSettings(res.settings);
      setNewApiKey('');
      setSavedSuccess(true);
      const updated = await freshTestApi.getGeminiStatus();
      setGeminiStatus(updated);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update system settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCompliance = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingCompliance(true);
      const res = await freshTestApi.updateAdminComplianceSettings(complianceSettings);
      if (res?.complianceSettings) {
        setComplianceSettings(res.complianceSettings);
      }
      setComplianceSavedSuccess(true);
      const checkRes = await freshTestApi.getAdminCashfreeReadinessChecklist();
      if (checkRes?.checklist) {
        setChecklist(checkRes.checklist);
      }
      setTimeout(() => setComplianceSavedSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update compliance settings');
    } finally {
      setSavingCompliance(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="py-20 text-center">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
        <p className="text-xs text-slate-500 mt-2">Loading system infrastructure settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Sliders className="w-6 h-6 text-blue-600" />
            <span>System & Gateway Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Cashfree Payment Gateway review readiness, public business compliance, and AI system infrastructure.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('compliance')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'compliance'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          <span>Cashfree Compliance & Readiness</span>
          {checklist && (
            <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
              checklist.overallStatus === 'READY'
                ? 'bg-emerald-400 text-slate-950'
                : 'bg-amber-300 text-slate-950'
            }`}>
              {checklist.readinessScore}%
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('infrastructure')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'infrastructure'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Infrastructure & AI Engine</span>
        </button>
      </div>

      {activeTab === 'compliance' && (
        <div className="space-y-8">
          {/* Header summary & score */}
          <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-sm space-y-4 border border-blue-900/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 inline-block mb-2">
                  Cashfree Merchant Review
                </span>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                  Payment Gateway Readiness Dashboard
                </h2>
                <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
                  Audit your SaaS against Cashfree onboarding compliance requirements: transparent pricing, active legal routes, business identity, and refund mechanisms.
                </p>
              </div>

              {checklist && (
                <div className="text-left sm:text-right shrink-0">
                  <div className="flex items-center gap-2 sm:justify-end">
                    <span className={`px-3 py-1 rounded-full text-xs font-black tracking-wide ${
                      checklist.overallStatus === 'READY'
                        ? 'bg-emerald-400 text-slate-950'
                        : 'bg-amber-300 text-slate-950'
                    }`}>
                      {checklist.overallStatus === 'READY' ? 'READY FOR REVIEW' : 'ACTION RECOMMENDED'}
                    </span>
                  </div>
                  <div className="text-3xl font-black mt-1 text-white">
                    {checklist.readinessScore}%
                  </div>
                  <span className="text-[11px] text-blue-200">
                    {checklist.items.filter((i: any) => i.status === 'COMPLIANT').length} of {checklist.items.length} checks passing
                  </span>
                </div>
              )}
            </div>

            {/* Quick Link bar */}
            <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-blue-300 text-[11px] font-semibold mr-1">Public Policy Routes:</span>
              <a href="/pricing" target="_blank" rel="noopener noreferrer" className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center gap-1">
                <span>/pricing</span> <ExternalLink className="w-3 h-3 text-blue-200" />
              </a>
              <a href="/contact" target="_blank" rel="noopener noreferrer" className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center gap-1">
                <span>/contact</span> <ExternalLink className="w-3 h-3 text-blue-200" />
              </a>
              <a href="/terms" target="_blank" rel="noopener noreferrer" className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center gap-1">
                <span>/terms</span> <ExternalLink className="w-3 h-3 text-blue-200" />
              </a>
              <a href="/privacy" target="_blank" rel="noopener noreferrer" className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center gap-1">
                <span>/privacy</span> <ExternalLink className="w-3 h-3 text-blue-200" />
              </a>
              <a href="/refund-policy" target="_blank" rel="noopener noreferrer" className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center gap-1">
                <span>/refund-policy</span> <ExternalLink className="w-3 h-3 text-blue-200" />
              </a>
              <a href="/subscription-terms" target="_blank" rel="noopener noreferrer" className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center gap-1">
                <span>/subscription-terms</span> <ExternalLink className="w-3 h-3 text-blue-200" />
              </a>
            </div>
          </div>

          {/* Form: Public Business Details */}
          <form onSubmit={handleSaveCompliance} className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Public Business & Support Details
                  </h3>
                  <p className="text-xs text-slate-500">
                    Displayed dynamically across PublicFooter, Contact Us page, and invoices.
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={savingCompliance}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50 shrink-0"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingCompliance ? 'Saving...' : 'Update Details'}</span>
              </button>
            </div>

            {complianceSavedSuccess && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Business compliance settings updated across all public pages and footer.</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-700 font-semibold">Public Brand Name *</label>
                <input
                  type="text"
                  required
                  value={complianceSettings.brandName || ''}
                  onChange={e => setComplianceSettings({ ...complianceSettings, brandName: e.target.value })}
                  placeholder="e.g. Qorbiq AI"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:border-blue-600 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-700 font-semibold">Legal Registered Business Name *</label>
                <input
                  type="text"
                  required
                  value={complianceSettings.legalBusinessName || ''}
                  onChange={e => setComplianceSettings({ ...complianceSettings, legalBusinessName: e.target.value })}
                  placeholder="e.g. Qorbiq AI / Registered Entity"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:border-blue-600 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-700 font-semibold">Support Email *</label>
                <input
                  type="email"
                  required
                  value={complianceSettings.supportEmail || ''}
                  onChange={e => setComplianceSettings({ ...complianceSettings, supportEmail: e.target.value })}
                  placeholder="e.g. support@qorbiq.ai"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:border-blue-600 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-700 font-semibold">Support Phone *</label>
                <input
                  type="text"
                  required
                  value={complianceSettings.supportPhone || ''}
                  onChange={e => setComplianceSettings({ ...complianceSettings, supportPhone: e.target.value })}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:border-blue-600 outline-none"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-slate-700 font-semibold">Registered Physical Address *</label>
                <input
                  type="text"
                  required
                  value={complianceSettings.address || ''}
                  onChange={e => setComplianceSettings({ ...complianceSettings, address: e.target.value })}
                  placeholder="e.g. Level 4, Cyber City, Magarpatta"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:border-blue-600 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-700 font-semibold">City *</label>
                <input
                  type="text"
                  required
                  value={complianceSettings.city || ''}
                  onChange={e => setComplianceSettings({ ...complianceSettings, city: e.target.value })}
                  placeholder="e.g. Pune"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:border-blue-600 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-700 font-semibold">State *</label>
                <input
                  type="text"
                  required
                  value={complianceSettings.state || ''}
                  onChange={e => setComplianceSettings({ ...complianceSettings, state: e.target.value })}
                  placeholder="e.g. Maharashtra"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:border-blue-600 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-700 font-semibold">Postal PIN Code *</label>
                <input
                  type="text"
                  required
                  value={complianceSettings.pinCode || ''}
                  onChange={e => setComplianceSettings({ ...complianceSettings, pinCode: e.target.value })}
                  placeholder="e.g. 411028"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:border-blue-600 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-700 font-semibold">Country</label>
                <input
                  type="text"
                  value={complianceSettings.country || 'India'}
                  onChange={e => setComplianceSettings({ ...complianceSettings, country: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:border-blue-600 outline-none"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-slate-700 font-semibold">Support Working Hours & Response SLA</label>
                <input
                  type="text"
                  value={complianceSettings.supportHours || ''}
                  onChange={e => setComplianceSettings({ ...complianceSettings, supportHours: e.target.value })}
                  placeholder="e.g. Monday – Friday, 10:00 AM – 6:00 PM IST (Responses within 48 business hours)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:border-blue-600 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-700 font-semibold">Canonical Website URL</label>
                <input
                  type="text"
                  value={complianceSettings.websiteUrl || ''}
                  onChange={e => setComplianceSettings({ ...complianceSettings, websiteUrl: e.target.value })}
                  placeholder="https://qorbiq.ai"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:border-blue-600 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-700 font-semibold">GSTIN (Optional / If Registered)</label>
                <input
                  type="text"
                  value={complianceSettings.gstin || ''}
                  onChange={e => setComplianceSettings({ ...complianceSettings, gstin: e.target.value })}
                  placeholder="e.g. 27ABCDE1234F1Z5"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:border-blue-600 outline-none"
                />
              </div>
            </div>
          </form>

          {/* Section: 16-point Cashfree Checklist */}
          {checklist && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <FileCheck2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900">
                      16-Point Cashfree Merchant Audit Checklist
                    </h3>
                    <p className="text-xs text-slate-500">
                      Evaluates presence and compliance of routes, terms, pricing, and gateway integrations.
                    </p>
                  </div>
                </div>

                {/* Filter chips */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {(['all', 'legal', 'pricing', 'technical', 'branding'] as const).map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setChecklistFilter(cat)}
                      className={`px-3 py-1 rounded-xl text-[11px] font-bold uppercase transition-all cursor-pointer ${
                        checklistFilter === cat
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Checklist items list */}
              <div className="space-y-3">
                {checklist.items
                  .filter((item: any) => checklistFilter === 'all' || item.category === checklistFilter)
                  .map((item: any) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-white transition-all space-y-2"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                            item.status === 'COMPLIANT'
                              ? 'bg-emerald-500'
                              : item.status === 'WARNING'
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`} />
                          <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                            {item.title}
                          </h4>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                            {item.category}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {item.route && (
                            <a
                              href={item.route}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] font-mono font-semibold text-blue-600 hover:underline flex items-center gap-1"
                            >
                              <span>{item.route}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            item.status === 'COMPLIANT'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.status === 'WARNING'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {item.status}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">
                        {item.description}
                      </p>

                      <div className="text-[11px] text-slate-500 bg-white p-2.5 rounded-xl border border-slate-100 font-mono">
                        {item.details}
                      </div>
                    </div>
                  ))}
              </div>

              {/* Disclaimer */}
              <div className="p-4 bg-slate-100 rounded-2xl text-[11px] text-slate-500 leading-relaxed">
                <strong>Cashfree Compliance Disclaimer:</strong> {checklist.disclaimer}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'infrastructure' && (
        <div className="space-y-6">
          {savedSuccess && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>System configuration updated and recorded to admin audit trail.</span>
            </div>
          )}

          {/* Health Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">AI Provider</span>
            <div className="text-sm font-bold text-slate-900 capitalize">{settings.aiProvider || 'Gemini 2.5'}</div>
            <span className="text-[10px] text-emerald-600">Server Side API Active</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Database Engine</span>
            <div className="text-sm font-bold text-slate-900">Firestore Isolated</div>
            <span className="text-[10px] text-indigo-600">Multi-Tenant Rules Enforced</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Security Claims</span>
            <div className="text-sm font-bold text-slate-900">Strict RBAC</div>
            <span className="text-[10px] text-emerald-600">Audit Logging Active</span>
          </div>
        </div>
      </div>

      {/* Gemini AI Provider Diagnostics Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Google Gemini AI Engine Diagnostics</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  geminiStatus?.configured
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {geminiStatus?.configured ? 'CONNECTED' : 'NOT CONFIGURED'}
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Official @google/genai SDK integration on server-side. Review drafts are grounded in real customer experience.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleTestGemini}
            disabled={testingGemini}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testingGemini ? 'animate-spin' : ''}`} />
            <span>{testingGemini ? 'Testing Gemini API...' : 'Test Gemini Connection'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">API Key Status</span>
            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${geminiStatus?.configured ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span>{geminiStatus?.configured ? 'Configured on Server' : 'Missing in server/.env'}</span>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Gemini Model</span>
            <div className="font-mono font-semibold text-blue-700">
              {geminiStatus?.model || settings.aiModel || 'gemini-2.5-flash'}
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Round-Trip Latency</span>
            <div className="font-semibold text-slate-900">
              {testResult?.latencyMs !== undefined ? `${testResult.latencyMs} ms` : 'Click "Test" to measure'}
            </div>
          </div>
        </div>

        {/* AI Engine Observability Metrics */}
        {aiMetrics && (
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
              Live AI Review Engine Observability Metrics (Server-Side)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 block">Total Generations</span>
                <span className="text-base font-bold text-slate-900 font-mono mt-0.5 block">{aiMetrics.totalGenerations || 0}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 block">Successful / Failed</span>
                <span className="text-base font-bold text-emerald-600 font-mono mt-0.5 block">
                  {aiMetrics.successfulGenerations || 0} <span className="text-slate-400 font-normal">/</span> <span className="text-rose-600">{aiMetrics.failedGenerations || 0}</span>
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 block">Regenerations</span>
                <span className="text-base font-bold text-blue-700 font-mono mt-0.5 block">{aiMetrics.regenerations || 0}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 block">Avg Latency</span>
                <span className="text-base font-bold text-slate-900 font-mono mt-0.5 block">{aiMetrics.averageResponseTimeMs || 0} ms</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 pt-1">
              <span>Credits Consumed: <strong className="text-slate-900 font-mono">{aiMetrics.creditsConsumed || 0}</strong></span>
              {aiMetrics.lastSuccessfulRequestAt && (
                <span>Last Success: <strong className="text-slate-700 font-mono">{new Date(aiMetrics.lastSuccessfulRequestAt).toLocaleTimeString()}</strong></span>
              )}
              {aiMetrics.lastFailedRequestAt && (
                <span className="text-rose-600">Last Error: <strong className="font-mono">{new Date(aiMetrics.lastFailedRequestAt).toLocaleTimeString()}</strong></span>
              )}
            </div>
          </div>
        )}

        {/* Test Result Message */}
        {testResult && (
          <div className={`p-4 rounded-2xl border text-xs flex items-start gap-3 ${
            testResult.success
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            {testResult.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <p className="font-bold">
                {testResult.success ? 'Gemini 2.5 Flash Connected & Verified' : 'Gemini Connection Test Failed'}
              </p>
              <p className="text-[11px] leading-relaxed opacity-90">
                {testResult.success
                  ? `Successfully contacted Google GenAI endpoint. Model: ${testResult.model}. Latency: ${testResult.latencyMs} ms. Grounded synthesis is operational.`
                  : testResult.error || 'Server could not reach Google Gemini. Verify GEMINI_API_KEY in server/.env.'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Firebase Cloud Firestore Synchronization Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0">
              <Cloud className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Firebase Cloud Firestore Database Sync</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                  READY
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Sync all local collections (Users, Businesses, QR Stands, Subscriptions, CRM Inquiries) with your Firebase project.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleSyncFirebase('push')}
              disabled={syncingFirebase}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              <CloudUpload className={`w-3.5 h-3.5 ${syncingFirebase ? 'animate-spin' : ''}`} />
              <span>{syncingFirebase ? 'Syncing to Firebase...' : 'Sync All to Firebase'}</span>
            </button>
            <button
              type="button"
              onClick={() => handleSyncFirebase('pull')}
              disabled={syncingFirebase}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
            >
              <CloudDownload className="w-3.5 h-3.5 text-slate-600" />
              <span>Pull from Remote</span>
            </button>
          </div>
        </div>

        {/* Firebase Config Details & Counts */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Firebase Project</span>
            <span className="text-xs font-mono font-bold text-slate-900 mt-0.5 block truncate">
              {syncStatus?.projectId || 'localos-ai-prod-saas'}
            </span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Storage Bucket</span>
            <span className="text-xs font-mono font-bold text-slate-900 mt-0.5 block truncate">
              {syncStatus?.storageBucket || 'localos-ai-prod-saas.firebasestorage.app'}
            </span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Businesses</span>
            <span className="text-base font-mono font-bold text-blue-600 mt-0.5 block">
              {syncStatus?.localCounts?.businesses ?? 0}
            </span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">QR Stands & Leads</span>
            <span className="text-base font-mono font-bold text-emerald-600 mt-0.5 block">
              {syncStatus?.localCounts?.qrCodes ?? 0} <span className="text-slate-400 text-xs font-normal">QRs</span> / {syncStatus?.localCounts?.crmLeads ?? 0} <span className="text-slate-400 text-xs font-normal">leads</span>
            </span>
          </div>
        </div>

        {/* Sync Result Feedback */}
        {syncResult && (
          <div className={`p-4 rounded-2xl border text-xs flex items-start gap-3 ${
            syncResult.success
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            {syncResult.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <p className="font-bold">
                {syncResult.success ? 'Firebase Firestore Synchronization Complete' : 'Firebase Sync Issue'}
              </p>
              <p className="text-[11px] leading-relaxed opacity-90">
                {syncResult.success && syncResult.result?.synced
                  ? `Successfully pushed: ${syncResult.result.synced.users} users, ${syncResult.result.synced.businesses} businesses, ${syncResult.result.synced.qrCodes} QR stands, ${syncResult.result.synced.subscriptions} subscriptions, and ${syncResult.result.synced.crmLeads} CRM leads to Firestore.`
                  : syncResult.success && syncResult.result?.imported
                  ? `Successfully pulled remote documents from Firestore into local database.`
                  : syncResult.error || 'Sync completed with warnings. Check Firestore security rules.'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
        <h2 className="text-base font-bold text-slate-900">Global Platform Configuration</h2>

        {/* Live Gemini API Key Card */}
        <div className="p-4.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-blue-600 shrink-0" />
              <label className="text-slate-900 font-bold text-xs">
                Google Gemini API Key (Live Server-Side Secrets)
              </label>
            </div>
            {settings.geminiApiKeyMasked ? (
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-mono flex items-center gap-1.5 w-fit">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Active: {settings.geminiApiKeyMasked}</span>
              </span>
            ) : (
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 font-mono w-fit">
                Not Configured
              </span>
            )}
          </div>

          <div className="relative">
            <input
              type={showApiKey ? 'text' : 'password'}
              value={newApiKey}
              onChange={e => setNewApiKey(e.target.value)}
              placeholder={settings.hasApiKey ? 'Enter new API key to replace active key...' : 'Paste your Google Gemini API key (AIzaSy...)'}
              className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-white border border-slate-200 text-slate-900 font-mono text-xs outline-hidden focus:border-blue-600 placeholder:text-slate-400 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              title={showApiKey ? 'Hide key' : 'Show key'}
            >
              {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Enter a new Google Cloud / Gemini API key here and click <strong>Save System Settings</strong>. Updates take effect immediately for all QR codes and customer review generations without needing a server restart.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1.5">
            <label className="text-slate-700 font-semibold">Default Monthly AI Draft Allowance</label>
            <input
              type="number"
              value={settings.defaultAiMonthlyLimit || 500}
              onChange={e => setSettings({ ...settings, defaultAiMonthlyLimit: Number(e.target.value) })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 outline-hidden focus:bg-white focus:border-blue-600"
            />
            <span className="text-[11px] text-slate-400">Default for ReviewFlow Pro subscriptions.</span>
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-700 font-semibold">Default Max Active QR Stands</label>
            <input
              type="number"
              value={settings.defaultQrLimit || 5}
              onChange={e => setSettings({ ...settings, defaultQrLimit: Number(e.target.value) })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 outline-hidden focus:bg-white focus:border-blue-600"
            />
            <span className="text-[11px] text-slate-400">QR code stands per business account.</span>
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-700 font-semibold">Gemini AI Model String</label>
            <input
              type="text"
              value={settings.aiModel || 'gemini-2.5-flash'}
              onChange={e => setSettings({ ...settings, aiModel: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono outline-hidden focus:bg-white focus:border-blue-600"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-700 font-semibold">Platform Version</label>
            <input
              type="text"
              disabled
              value={settings.version || '3.0.0-production'}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-400 font-mono"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-400">Last updated: {new Date(settings.updatedAt).toLocaleString()}</span>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Updating...' : 'Save System Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  )}
</div>
  );
};
