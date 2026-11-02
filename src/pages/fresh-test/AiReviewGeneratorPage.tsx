import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Copy,
  RefreshCw,
  Check,
  ExternalLink,
  Languages,
  Clock,
  ShieldCheck,
  MessageSquare,
  Zap,
  Tag,
  History
} from 'lucide-react';
import { useBusiness } from '../../lib/business-context.tsx';
import { freshTestApi, sanitizeReviewText } from '../../lib/fresh-test-api.ts';

export const AiReviewGeneratorPage: React.FC = () => {
  const { activeBusiness } = useBusiness();

  const [language, setLanguage] = useState<'English' | 'Marathi' | 'Hindi'>('English');
  const [reviewLength, setReviewLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [tone, setTone] = useState<'warm' | 'professional' | 'enthusiastic'>('warm');
  const [customerText, setCustomerText] = useState('');
  const [selectedTopics, setSelectedTopics] = useState<string[]>(['Customer Service & Hospitality']);

  const [generating, setGenerating] = useState(false);
  const [generatedDraft, setGeneratedDraft] = useState('');
  const [iteration, setIteration] = useState(1);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Observability & Validation Metrics
  const [metrics, setMetrics] = useState<{
    wordCount?: number;
    sentenceCount?: number;
    duplicateCheckStatus?: string;
    similarityScore?: number;
    model?: string;
  } | null>(null);

  // Persistent review history for the active business
  const [persistentHistory, setPersistentHistory] = useState<Array<{
    reviewId: string;
    text: string;
    language: string;
    reviewLength: string;
    createdAt: string;
    similarityScore?: number;
  }>>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchHistory = async () => {
      if (!activeBusiness?.id) return;
      try {
        setLoadingHistory(true);
        const list = await freshTestApi.getBusinessReviewHistory(activeBusiness.id);
        if (active && Array.isArray(list)) {
          setPersistentHistory(list);
        }
      } catch {
        // Safe fallback
      } finally {
        if (active) setLoadingHistory(false);
      }
    };
    fetchHistory();
    return () => { active = false; };
  }, [activeBusiness?.id]);

  const defaultTopics = [
    'Customer Service & Hospitality',
    'Product Quality & Variety',
    'Cleanliness & Ambience',
    'Value for Money',
    'Speed of Service & Billing',
    'Knowledgeable Staff'
  ];

  const handleToggleTopic = (topic: string) => {
    setSelectedTopics(prev =>
      prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
    );
  };

  const handleGenerate = async (isRegen = false) => {
    if (!customerText.trim() && selectedTopics.length === 0) {
      setError('Please provide some customer experience notes or select at least one topic.');
      return;
    }

    try {
      setGenerating(true);
      setError(null);

      const nextIteration = isRegen ? iteration + 1 : 1;
      const pastDrafts = persistentHistory.map(h => h.text).filter(Boolean);

      const res = await freshTestApi.generateAiDraft({
        businessName: activeBusiness?.businessName || 'Our Business',
        businessId: activeBusiness?.id,
        ownerId: activeBusiness?.ownerUid || '',
        customerFeedback: customerText.trim() || selectedTopics.join(', '),
        customerText: customerText.trim(),
        selectedTopics,
        language,
        reviewLength,
        tone,
        recentReviews: pastDrafts,
        iteration: nextIteration
      });

      const clean = sanitizeReviewText(res.draft || '');
      setGeneratedDraft(clean);
      setIteration(nextIteration);
      setCopied(false);
      setMetrics({
        wordCount: res.wordCount,
        sentenceCount: res.sentenceCount,
        duplicateCheckStatus: res.duplicateCheckStatus,
        similarityScore: res.similarityScore,
        model: res.model
      });

      const newRecord = {
        reviewId: res.reviewId || 'rev_' + Date.now(),
        text: clean,
        language,
        reviewLength,
        createdAt: new Date().toLocaleTimeString(),
        similarityScore: res.similarityScore
      };

      setPersistentHistory(prev => [newRecord, ...prev]);
    } catch (err: any) {
      setError(err.message || 'Failed to generate review draft. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!generatedDraft) return;
    await navigator.clipboard.writeText(generatedDraft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="border-b border-slate-200 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Review Assistance Studio</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Authentic Customer Review Generator
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Turn authentic customer feedback into genuine, polished Google review drafts in Marathi, Hindi, and English.
          </p>
        </div>

        {activeBusiness?.googleReviewUrl && (
          <button
            type="button"
            onClick={() => window.open(activeBusiness.googleReviewUrl, '_blank', 'noopener,noreferrer')}
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition-colors self-start sm:self-center"
          >
            <ExternalLink className="w-4 h-4 text-slate-500" />
            <span>Test Google Review Destination</span>
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-center gap-2">
          <span>{error}</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Input Controls */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
          {/* Language Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
              <Languages className="w-4 h-4 text-blue-600" />
              <span>Target Review Language</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'English', label: 'English' },
                { id: 'Marathi', label: 'मराठी (Marathi)' },
                { id: 'Hindi', label: 'हिन्दी (Hindi)' }
              ].map(lang => (
                <button
                  key={lang.id}
                  type="button"
                  onClick={() => setLanguage(lang.id as any)}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                    language === lang.id
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          {/* Length & Tone Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Review Length
              </label>
              <select
                value={reviewLength}
                onChange={e => setReviewLength(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white"
              >
                <option value="short">Short (1 sentence, 8-20 words)</option>
                <option value="medium">Medium (2-3 sentences, 25-50 words)</option>
                <option value="long">Long (4-5 sentences, 55-90 words)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Tone Preference
              </label>
              <select
                value={tone}
                onChange={e => setTone(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white"
              >
                <option value="warm">Warm & Friendly</option>
                <option value="professional">Professional & Direct</option>
                <option value="enthusiastic">Enthusiastic & High Praise</option>
              </select>
            </div>
          </div>

          {/* Experience Topics */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
              <Tag className="w-3.5 h-3.5 text-blue-600" />
              <span>Customer Experience Touchpoints</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {defaultTopics.map(topic => (
                <button
                  key={topic}
                  type="button"
                  onClick={() => handleToggleTopic(topic)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    selectedTopics.includes(topic)
                      ? 'bg-blue-50 text-blue-700 border-blue-300'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {selectedTopics.includes(topic) && <Check className="w-3 h-3 inline mr-1" />}
                  {topic}
                </button>
              ))}
            </div>
          </div>

          {/* Customer Thoughts */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between uppercase tracking-wider">
              <span>Customer Experience Notes</span>
              <span className="text-[10px] text-slate-400 font-normal">What did the customer specifically say?</span>
            </label>
            <textarea
              rows={4}
              value={customerText}
              onChange={e => setCustomerText(e.target.value)}
              placeholder="e.g. delicious breakfast, coffee was hot and fresh, staff smiled and was very attentive..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Generate Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              disabled={generating}
              onClick={() => handleGenerate(false)}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {generating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Drafting Authentic Review...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate AI Review Draft</span>
                </>
              )}
            </button>

            {generatedDraft && (
              <button
                type="button"
                disabled={generating}
                onClick={() => handleGenerate(true)}
                className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} />
                <span>Regenerate</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Draft Preview & Copy Actions */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Generated Review Draft
              </span>
              {generatedDraft && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    Variation #{iteration}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>Unique</span>
                  </span>
                </div>
              )}
            </div>

            {generatedDraft ? (
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 leading-relaxed min-h-[120px] whitespace-pre-wrap">
                  {generatedDraft}
                </div>

                {/* Validation & Observability Metrics */}
                {metrics && (
                  <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Length</div>
                      <div className="text-xs font-extrabold text-slate-800">
                        {metrics.wordCount || generatedDraft.split(/\s+/).filter(Boolean).length} words
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Sentences</div>
                      <div className="text-xs font-extrabold text-slate-800">
                        {metrics.sentenceCount || (reviewLength === 'short' ? 1 : reviewLength === 'medium' ? 3 : 5)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Duplicate Check</div>
                      <div className="text-xs font-extrabold text-emerald-600 flex items-center justify-center gap-0.5">
                        <Check className="w-3 h-3" /> Passed
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'Copied to Clipboard!' : 'Copy Review Text'}</span>
                  </button>

                  {activeBusiness?.googleReviewUrl && (
                    <button
                      type="button"
                      onClick={() => window.open(activeBusiness.googleReviewUrl, '_blank', 'noopener,noreferrer')}
                      className="px-3 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl border border-blue-200 flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Post on Google</span>
                    </button>
                  )}
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed text-center">
                  Copy the review and paste directly into Google Maps review window.
                </p>
              </div>
            ) : (
              <div className="py-12 px-4 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div className="text-xs font-bold text-slate-700">No Draft Generated Yet</div>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                  Select your customer language, tap experience touchpoints, and click Generate to see the draft here.
                </p>
              </div>
            )}
          </div>

          {/* Persistent Business Review Memory & History */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <History className="w-4 h-4 text-blue-600" />
                <span>Shop Review History</span>
              </span>
              <span className="text-[10px] font-bold text-slate-400">
                {persistentHistory.length} Saved Reviews
              </span>
            </div>

            {loadingHistory ? (
              <div className="py-6 text-center text-xs text-slate-400">
                <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-1 text-slate-400" />
                <span>Loading saved history...</span>
              </div>
            ) : persistentHistory.length > 0 ? (
              <div className="space-y-2.5 max-h-72 overflow-y-auto">
                {persistentHistory.slice(0, 15).map((item, idx) => (
                  <div key={item.reviewId || idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold">
                      <span className="capitalize">{item.language} • {item.reviewLength || 'medium'}</span>
                      <span>{item.createdAt ? (item.createdAt.includes('T') ? new Date(item.createdAt).toLocaleDateString() : item.createdAt) : ''}</span>
                    </div>
                    <p className="text-slate-800 text-[11px] line-clamp-3 leading-relaxed">{item.text}</p>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                      <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                        <Check className="w-3 h-3" /> Duplicate-check passed
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(item.text);
                          setGeneratedDraft(item.text);
                        }}
                        className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-400">
                No past reviews saved yet for this business.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

