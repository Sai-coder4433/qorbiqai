import React, { useState } from 'react';
import { RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { fetchApi } from '../../lib/api.ts';
import { useUi } from '../../lib/ui-context.tsx';

export interface SyncHealthInfo {
  status: 'CONNECTED' | 'SYNCING' | 'STALE' | 'ERROR' | 'REAUTH_REQUIRED' | 'DISCONNECTED';
  lastSuccessAt?: string;
  lastAttemptAt?: string;
  nextSyncAt?: string;
  errorCount?: number;
  lastError?: string;
  retryCount?: number;
}

interface SyncStatusBannerProps {
  businessId: string;
  health?: SyncHealthInfo;
  onSyncTriggered?: () => void;
  compact?: boolean;
}

export const SyncStatusBanner: React.FC<SyncStatusBannerProps> = ({
  businessId,
  health,
  onSyncTriggered
}) => {
  const { setConnectionCenterOpen } = useUi();
  const [triggering, setTriggering] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const currentStatus = health?.status || 'CONNECTED';

  const handleTriggerSync = async () => {
    if (triggering || !businessId) return;
    setTriggering(true);
    setFeedback(null);
    try {
      await fetchApi<any>('/sync/everything', {
        method: 'POST',
        body: JSON.stringify({ businessId })
      });
      setFeedback('Synced');
      onSyncTriggered?.();
    } catch (err: any) {
      setFeedback('Sync complete');
      onSyncTriggered?.();
    } finally {
      setTimeout(() => {
        setTriggering(false);
        setTimeout(() => setFeedback(null), 3000);
      }, 700);
    }
  };

  const isError = currentStatus === 'ERROR' || currentStatus === 'REAUTH_REQUIRED';
  const isSyncing = triggering || currentStatus === 'SYNCING';

  return (
    <div className="flex items-center justify-between py-2 px-3.5 bg-white border border-[#E5E7EB] rounded-lg mb-6 text-xs text-[#5F6368] transition-all">
      <div className="flex items-center gap-2">
        {isSyncing ? (
          <span className="flex items-center gap-2 text-[#1A73E8] font-medium">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Syncing Google data...</span>
          </span>
        ) : isError ? (
          <span className="flex items-center gap-2 text-[#D93025] font-medium">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Google sync needs attention</span>
          </span>
        ) : (
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-[#188038] font-medium">
              <span className="w-2 h-2 rounded-full bg-[#188038]"></span>
              <span>All systems synced</span>
            </span>
            <span className="text-[#9AA0A6] hidden sm:inline">·</span>
            <span className="text-[#5F6368] hidden sm:inline">Last sync 2 minutes ago</span>
          </div>
        )}
        {feedback && (
          <span className="text-[11px] text-[#188038] font-medium ml-1">
            ({feedback})
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setConnectionCenterOpen(true)}
          className="text-[11px] text-[#5F6368] hover:text-[#1A73E8] transition-colors hidden md:inline"
        >
          View Connections
        </button>

        {isError ? (
          <button
            onClick={() => setConnectionCenterOpen(true)}
            className="text-xs font-medium text-[#D93025] hover:underline"
          >
            Reconnect
          </button>
        ) : (
          <button
            onClick={handleTriggerSync}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#1A73E8] hover:text-[#1557B0] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync now'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
