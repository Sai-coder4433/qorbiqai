import React, { useState, useEffect } from 'react';
import { Sliders, Server, ShieldCheck, CheckCircle2, RefreshCw, Cpu, Database, Save, Sparkles, AlertCircle, Key, Eye, EyeOff, CloudUpload, CloudDownload, Cloud, Check } from 'lucide-react';
import { freshTestApi } from '../../lib/fresh-test-api.ts';

export const SuperAdminSystemPage: React.FC = () => {
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

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const [sysRes, geminiRes, metricsRes, syncRes] = await Promise.allSettled([
        freshTestApi.getAdminSystem(),
        freshTestApi.getGeminiStatus(),
        freshTestApi.getAiObservabilityMetrics(),
        freshTestApi.getFirebaseSyncStatus()
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
      <div className="flex items-center justify-between pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Sliders className="w-6 h-6 text-blue-600" />
            <span>System Infrastructure</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Global AI provider status, default quotas, and system maintenance flags.
          </p>
        </div>
      </div>

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
  );
};
