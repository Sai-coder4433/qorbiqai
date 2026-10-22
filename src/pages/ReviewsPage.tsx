import React, { useState, useEffect } from 'react';
import {
  Star,
  MessageSquare,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Send,
  CheckCircle2,
  Filter,
  CornerDownRight,
  Clock,
  Sparkles,
  Link2
} from 'lucide-react';
import { fetchApi } from '../lib/api.ts';
import { AppLayout } from '../components/layout/AppLayout.tsx';

interface ReviewItem {
  id: string;
  reviewerName: string;
  starRating: number;
  comment: string;
  createTime: string;
  replyComment?: string;
  replyStatus: 'REPLIED' | 'UNREPLIED';
}

export const ReviewsPage: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [business, setBusiness] = useState<any>(null);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [filterReplyStatus, setFilterReplyStatus] = useState<'ALL' | 'UNREPLIED' | 'REPLIED'>('ALL');

  // Reply modal
  const [replyingTo, setReplyingTo] = useState<ReviewItem | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [connectingGoogle, setConnectingGoogle] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchApi<any>('/google-profile/status?businessId=biz_001');
      if (res) {
        setProfile(res.profile);
        setBusiness(res.business);
      }

      // Load reviews
      const revRes = await fetchApi<any>('/reviews?businessId=biz_001');
      if (revRes?.reviews) {
        setReviews(revRes.reviews);
      }
    } catch (e) {
      console.error('Failed to load review management:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleConnectProfile = async () => {
    setConnectingGoogle(true);
    try {
      await fetchApi('/google-profile/connect', {
        method: 'POST',
        body: JSON.stringify({ businessId: 'biz_001', placeId: 'ChIJ_AtharvPlaceId' })
      });
      await loadData();
    } catch (e: any) {
      alert(e.message || 'Connection failed');
    } finally {
      setConnectingGoogle(false);
    }
  };

  const handleDisconnectProfile = async () => {
    if (!confirm('Are you sure you want to disconnect Google Business Profile?')) return;
    try {
      await fetchApi('/google-profile/disconnect', {
        method: 'POST',
        body: JSON.stringify({ businessId: 'biz_001' })
      });
      await loadData();
    } catch (e: any) {
      alert(e.message || 'Disconnect failed');
    }
  };

  const handleSendReply = async () => {
    if (!replyingTo || !replyText.trim()) return;
    setSubmittingReply(true);
    try {
      await fetchApi(`/reviews/${replyingTo.id}/reply`, {
        method: 'POST',
        body: JSON.stringify({ reply: replyText.trim() })
      });
      setReviews(prev =>
        prev.map(r =>
          r.id === replyingTo.id ? { ...r, replyComment: replyText.trim(), replyStatus: 'REPLIED' } : r
        )
      );
      setReplyingTo(null);
      setReplyText('');
    } catch (e: any) {
      alert(e.message || 'Failed to post reply');
    } finally {
      setSubmittingReply(false);
    }
  };

  const filteredReviews = reviews.filter(r => {
    if (filterRating && r.starRating !== filterRating) return false;
    if (filterReplyStatus === 'UNREPLIED' && r.replyStatus !== 'UNREPLIED') return false;
    if (filterReplyStatus === 'REPLIED' && r.replyStatus !== 'REPLIED') return false;
    return true;
  });

  const isConnected = profile?.isConnected;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Google Reviews</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Monitor, audit, and reply to official customer reviews on Google Maps.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={business?.googleReviewUrl || 'https://google.com'}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Test Review Link <ExternalLink className="w-3.5 h-3.5" />
            </a>
            {isConnected ? (
              <button
                onClick={handleDisconnectProfile}
                className="px-3 py-2 text-xs font-medium border border-rose-200 dark:border-rose-900 text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30"
              >
                Disconnect GBP
              </button>
            ) : (
              <button
                onClick={handleConnectProfile}
                disabled={connectingGoogle}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
              >
                <ShieldCheck className="w-4 h-4" />
                {connectingGoogle ? 'Connecting...' : 'Connect Google Profile'}
              </button>
            )}
          </div>
        </div>

        {/* Google Profile Connection Status Card (Section 9) */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900 flex items-center justify-center font-bold text-lg text-blue-600 shrink-0">
                G
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-zinc-900 dark:text-white">
                    {business?.name || 'Atharv Electricals'}
                  </h2>
                  {isConnected ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                      <CheckCircle2 className="w-3 h-3" /> Connected
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                      <AlertCircle className="w-3 h-3" /> Not Connected
                    </span>
                  )}
                </div>
                <div className="text-xs text-zinc-500 mt-1">
                  {business?.category || 'Electrical Equipment'} • {business?.address || 'Chakan, Pune'}
                </div>
                <div className="text-xs text-zinc-400 font-mono mt-1 truncate max-w-lg">
                  Direct Review URL: {business?.googleReviewUrl}
                </div>
              </div>
            </div>

            {/* Live Rating & Review Count (when connected) */}
            <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-zinc-100 dark:border-zinc-800 pt-4 md:pt-0 md:pl-6 shrink-0">
              <div>
                <div className="text-[11px] text-zinc-400 uppercase font-semibold">Google Rating</div>
                <div className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-1 mt-0.5">
                  {isConnected ? profile?.overallRating || '4.8' : '—'}
                  {isConnected && <Star className="w-5 h-5 text-amber-500 fill-amber-500" />}
                </div>
                <div className="text-[10px] text-zinc-400">
                  {isConnected ? 'Verified from GBP' : 'OAuth Required'}
                </div>
              </div>

              <div>
                <div className="text-[11px] text-zinc-400 uppercase font-semibold">Total Reviews</div>
                <div className="text-2xl font-bold text-zinc-900 dark:text-white mt-0.5">
                  {isConnected ? profile?.totalReviewCount || reviews.length : '—'}
                </div>
                <div className="text-[10px] text-zinc-400">
                  {isConnected ? 'Synced from API' : 'OAuth Required'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-500 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Filters:
            </span>
            <button
              onClick={() => setFilterReplyStatus('ALL')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                filterReplyStatus === 'ALL'
                  ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                  : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
              }`}
            >
              All ({reviews.length})
            </button>
            <button
              onClick={() => setFilterReplyStatus('UNREPLIED')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                filterReplyStatus === 'UNREPLIED'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
              }`}
            >
              Unreplied ({reviews.filter(r => r.replyStatus === 'UNREPLIED').length})
            </button>
            <button
              onClick={() => setFilterReplyStatus('REPLIED')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                filterReplyStatus === 'REPLIED'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
              }`}
            >
              Replied ({reviews.filter(r => r.replyStatus === 'REPLIED').length})
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-zinc-400">Stars:</span>
            {[5, 4, 3, 2, 1].map(stars => (
              <button
                key={stars}
                onClick={() => setFilterRating(filterRating === stars ? null : stars)}
                className={`px-2 py-1 rounded border text-xs font-semibold ${
                  filterRating === stars
                    ? 'bg-amber-500 text-white border-amber-500'
                    : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                }`}
              >
                {stars}★
              </button>
            ))}
          </div>
        </div>

        {/* Reviews List */}
        <div className="space-y-3">
          {loading ? (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 rounded-xl text-center text-xs text-zinc-400">
              Loading Google reviews...
            </div>
          ) : filteredReviews.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 rounded-xl text-center text-xs text-zinc-400">
              No customer reviews match your filter.
            </div>
          ) : (
            filteredReviews.map(r => (
              <div
                key={r.id}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-2xs space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center text-xs">
                      {r.reviewerName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-xs text-zinc-900 dark:text-white flex items-center gap-2">
                        {r.reviewerName}
                        <span className="text-amber-500 font-bold tracking-wider text-xs">
                          {'★'.repeat(r.starRating)}
                          <span className="text-zinc-300 dark:text-zinc-700">{'★'.repeat(5 - r.starRating)}</span>
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-400 mt-0.5">
                        {new Date(r.createTime).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {r.replyStatus === 'REPLIED' ? (
                      <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                        Replied
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          setReplyingTo(r);
                          setReplyText(
                            `Thank you ${r.reviewerName} for your positive feedback! We truly appreciate your support at ${business?.name || 'Atharv Electricals'}.`
                          );
                        }}
                        className="px-3 py-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-semibold rounded text-xs transition-colors"
                      >
                        Reply
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  {r.comment || <span className="italic text-zinc-400">Left rating with no written text.</span>}
                </p>

                {/* Published Reply */}
                {r.replyComment && (
                  <div className="bg-zinc-50 dark:bg-zinc-800/40 border-l-2 border-blue-600 p-3 rounded-r-lg text-xs space-y-1">
                    <div className="font-bold text-[11px] text-zinc-900 dark:text-white flex items-center gap-1">
                      <CornerDownRight className="w-3 h-3 text-blue-600" /> Response from the owner
                    </div>
                    <p className="text-zinc-600 dark:text-zinc-400">{r.replyComment}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* REPLY COMPOSER MODAL */}
        {replyingTo && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
              <div>
                <h3 className="font-bold text-base text-zinc-900 dark:text-white">
                  Reply to {replyingTo.reviewerName}
                </h3>
                <div className="text-xs text-amber-500 font-bold mt-1">
                  {'★'.repeat(replyingTo.starRating)}
                  <span className="text-zinc-300">{'★'.repeat(5 - replyingTo.starRating)}</span>
                </div>
                <p className="text-xs text-zinc-500 italic mt-1 line-clamp-2">"{replyingTo.comment}"</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                  Your Public Google Reply
                </label>
                <textarea
                  rows={4}
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="Thank the customer for their review..."
                />
              </div>

              <div className="flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setReplyingTo(null)}
                  className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg font-medium text-zinc-600 dark:text-zinc-400"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendReply}
                  disabled={submittingReply || !replyText.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg shadow-sm flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  {submittingReply ? 'Publishing...' : 'Publish to Google'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};
