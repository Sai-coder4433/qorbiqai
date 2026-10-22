import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  Sparkles,
  Copy,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Building2,
  Languages,
  Edit3,
  RotateCcw,
  Check,
  ShieldCheck,
  MapPin,
  FileText
} from 'lucide-react';
import { freshTestApi, CustomerQrLookup, sanitizeReviewText } from '../../lib/fresh-test-api.ts';

export const CustomerReviewPage: React.FC = () => {
  const { uniqueQrCodeId, code, qrCode } = useParams<{ uniqueQrCodeId?: string; code?: string; qrCode?: string }>();
  const activeCode = uniqueQrCodeId || code || qrCode || '';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [businessInfo, setBusinessInfo] = useState<CustomerQrLookup | null>(null);

  // Review Session ID for continuous regeneration tracking (Section 26)
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Experience Card selection & customer input (Section 3)
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [customerText, setCustomerText] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('English');

  // Generation & Draft State
  const [generating, setGenerating] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generatedDraft, setGeneratedDraft] = useState('');
  const [generationNumber, setGenerationNumber] = useState(1);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [wordCount, setWordCount] = useState(0);

  // Copy Feedback (Section 32)
  const [copied, setCopied] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);

  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const reviewResultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeCode) {
      loadBusinessData(activeCode);
    } else {
      setError('Invalid or missing review QR stand code.');
      setLoading(false);
    }
  }, [activeCode]);

  const loadBusinessData = async (codeStr: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await freshTestApi.lookupQr(codeStr);
      setBusinessInfo(data);
      if (data.supportedLanguages && data.supportedLanguages.length > 0) {
        setSelectedLanguage(data.supportedLanguages[0]);
      }
      freshTestApi.recordEvent(codeStr, 'PAGE_VIEW');
    } catch (err: any) {
      setError(err.message || 'Unable to load business details for this QR code.');
    } finally {
      setLoading(false);
    }
  };

  // 7-8 Category-specific Experience Topics (Section 7, NO EMOJIS)
  const experienceCards = businessInfo?.experienceCards || [
    { id: 'card_1', title: 'Overall Experience' },
    { id: 'card_2', title: 'Staff Assistance' },
    { id: 'card_3', title: 'Service Experience' },
    { id: 'card_4', title: 'Communication' },
    { id: 'card_5', title: 'Turnaround Time' },
    { id: 'card_6', title: 'Quality of Work' },
    { id: 'card_7', title: 'Customer Care' },
    { id: 'card_other', title: 'Something Else' }
  ];

  const handleToggleCard = (cardId: string) => {
    if (selectedCardIds.includes(cardId)) {
      setSelectedCardIds(prev => prev.filter(id => id !== cardId));
    } else {
      setSelectedCardIds(prev => [...prev, cardId]);
      if (activeCode) {
        freshTestApi.recordEvent(activeCode, 'CARD_SELECTED', { cardId });
      }
    }
  };

  const calculateWords = (text: string): number => {
    if (!text || !text.trim()) return 0;
    return text.trim().split(/\s+/).filter(Boolean).length;
  };

  // Core Generation & Regeneration Handler (Sections 3, 10, 13, 30, 33)
  const handleGenerateDraft = async (isRegen = false) => {
    const trimmedInput = customerText.trim();

    // If no topics selected AND no text, block
    if (selectedCardIds.length === 0 && (!trimmedInput || trimmedInput.length < 2)) {
      setGenerationError(
        'Please select at least one topic or tell us about your experience.'
      );
      return;
    }

    if (generating || isRegenerating) return;

    try {
      setGenerationError(null);
      if (isRegen) {
        setIsRegenerating(true);
      } else {
        setGenerating(true);
      }

      const nextGenNumber = isRegen ? generationNumber + 1 : 1;
      const newRequestId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'req_' + Date.now();

      const selectedTitles = experienceCards
        .filter(c => selectedCardIds.includes(c.id))
        .map(c => c.title);

      const result = await freshTestApi.generateAiDraft({
        requestId: newRequestId,
        customerText: trimmedInput,
        customerFeedback: trimmedInput,
        selectedTopics: selectedTitles,
        selectedExperienceCards: selectedTitles,
        language: selectedLanguage,
        businessName: businessInfo?.businessName || '',
        businessId: businessInfo?.id,
        uniqueCode: activeCode,
        sessionId: sessionId || undefined,
        generationNumber: nextGenNumber,
        iteration: nextGenNumber
      });

      const cleanDraft = sanitizeReviewText(result.draft || '');
      if (!cleanDraft || cleanDraft.length === 0) {
        throw new Error('Unable to generate a new review right now Please try again');
      }

      setGeneratedDraft(cleanDraft);
      setGenerationNumber(nextGenNumber);
      if (result.sessionId) {
        setSessionId(result.sessionId);
      }
      setWordCount(calculateWords(cleanDraft));
      setHasGenerated(true);
      setCopied(false);
      setCopyFeedback(null);

      // Scroll to review display
      setTimeout(() => {
        reviewResultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    } catch (err: any) {
      setGenerationError(err.message || 'AI review generation is temporarily unavailable. Please try again.');
    } finally {
      setGenerating(false);
      setIsRegenerating(false);
    }
  };

  // Section 32: Clipboard Copy Behavior
  const handleCopy = async () => {
    const rawText = textAreaRef.current?.value !== undefined ? textAreaRef.current.value : generatedDraft;
    const textToCopy = sanitizeReviewText(rawText);
    if (!textToCopy) return;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setCopyFeedback('Review copied.');
      if (activeCode) {
        freshTestApi.recordEvent(activeCode, 'REVIEW_COPIED');
      }
      setTimeout(() => setCopied(false), 4000);
    } catch {
      // Fallback if browser blocks automatic clipboard API
      const el = document.createElement('textarea');
      el.value = textToCopy;
      document.body.appendChild(el);
      el.select();
      const success = document.execCommand('copy');
      document.body.removeChild(el);

      if (success) {
        setCopied(true);
        setCopyFeedback('Review copied.');
        setTimeout(() => setCopied(false), 4000);
      } else {
        setCopied(false);
        setCopyFeedback('Review ready — tap Copy to copy it.');
      }
    }
  };

  // Section 23: Open Google Review (Customer manually controls posting)
  const handleOpenGoogle = () => {
    if (!businessInfo?.googleReviewUrl) return;

    if (activeCode) {
      freshTestApi.recordEvent(activeCode, 'GOOGLE_REVIEW_CLICKED');
    }

    window.open(businessInfo.googleReviewUrl, '_blank', 'noopener,noreferrer');
  };

  const handleResetSession = () => {
    setCustomerText('');
    setSelectedCardIds([]);
    setGeneratedDraft('');
    setHasGenerated(false);
    setGenerationNumber(1);
    setSessionId(null);
    setCopied(false);
    setCopyFeedback(null);
    setShowResetModal(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm max-w-sm w-full text-center space-y-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <RefreshCw className="w-5 h-5 animate-spin" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 text-base">Opening Review Experience</h3>
            <p className="text-xs text-slate-500 mt-1">Connecting to business details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !businessInfo) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl border border-rose-200 shadow-sm max-w-md w-full text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-lg">Unable to Open Page</h3>
            <p className="text-sm text-slate-600 mt-1 leading-relaxed">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const selectedCards = experienceCards.filter(c => selectedCardIds.includes(c.id));
  const canGenerate = (selectedCardIds.length > 0 || customerText.trim().length >= 3) && !generating && !isRegenerating;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-start p-4 sm:p-6 font-sans antialiased">
      <div className="w-full max-w-xl mx-auto space-y-4 py-4 sm:py-6">
        {/* Business Header: Logo, Name, Location */}
        <header className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center gap-4">
          {businessInfo.logoUrl ? (
            <img
              src={businessInfo.logoUrl}
              alt={businessInfo.businessName}
              className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg border border-blue-100 shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight truncate">
              {businessInfo.businessName}
            </h1>
            {businessInfo.location && (
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{businessInfo.location}</span>
              </p>
            )}
          </div>
        </header>

        {/* MAIN CARD */}
        <main className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          {!hasGenerated ? (
            <div className="space-y-6">
              {/* Question Heading (Section 3 & 30) */}
              <div className="space-y-1">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                  How was your experience?
                </h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  Select the topics you want to talk about.
                </p>
              </div>

              {/* 7-8 Minimal Experience Boxes (NO EMOJIS, Section 7) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {experienceCards.map((card) => {
                  const isSelected = selectedCardIds.includes(card.id);
                  return (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => handleToggleCard(card.id)}
                      className={`p-3.5 rounded-xl text-left border transition-all cursor-pointer flex items-center justify-between select-none ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/60 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/60'
                      }`}
                    >
                      <span
                        className={`text-sm ${
                          isSelected ? 'text-blue-900 font-semibold' : 'text-slate-800 font-normal'
                        }`}
                      >
                        {card.title}
                      </span>
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ml-2 transition-colors ${
                          isSelected ? 'bg-blue-600 text-white' : 'border border-slate-300 bg-transparent'
                        }`}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Selected Topics Pill Summary */}
              {selectedCards.length > 0 && (
                <div className="pt-1">
                  <div className="text-xs font-semibold text-slate-500 mb-1.5">
                    Selected Topics:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedCards.map((c) => (
                      <span
                        key={c.id}
                        className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-xs font-medium"
                      >
                        {c.title}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Customer Experience Input (Section 3 & 30: MANDATORY INPUT) */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div>
                  <label
                    htmlFor="customerExperienceInput"
                    className="block text-xs font-bold text-slate-800 mb-1"
                  >
                    Add more details <span className="text-slate-400 font-normal">(optional — improves your review)</span>
                  </label>
                  <textarea
                    id="customerExperienceInput"
                    rows={4}
                    value={customerText}
                    onChange={(e) => setCustomerText(e.target.value)}
                    placeholder="Tell us what you personally experienced — what you liked, what stood out, or anything you would like to mention."
                    className="w-full p-4 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all resize-none leading-relaxed"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    AI crafts your review strictly around your personal experience.
                  </p>
                </div>

                {/* Language Selector: English, मराठी, हिंदी (Section 30) */}
                <div className="space-y-1.5 pt-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Review Language
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'English', label: 'English' },
                      { id: 'Marathi', label: 'मराठी' },
                      { id: 'Hindi', label: 'हिंदी' }
                    ].map((lang) => (
                      <button
                        key={lang.id}
                        type="button"
                        onClick={() => setSelectedLanguage(lang.id)}
                        className={`py-2 px-3 rounded-lg text-xs font-medium border transition-all cursor-pointer text-center ${
                          selectedLanguage.toLowerCase() === lang.id.toLowerCase()
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Error Alert */}
                {generationError && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{generationError}</span>
                  </div>
                )}

                {/* Generate Review Button (Section 30) */}
                <button
                  type="button"
                  id="generateReviewDraftButton"
                  onClick={() => handleGenerateDraft(false)}
                  disabled={!canGenerate}
                  className={`w-full py-3.5 px-5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer mt-2 ${
                    canGenerate
                      ? 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow active:scale-[0.99]'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {generating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>Creating your review...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate Review</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Review Output (Section 30 & 31: Large, readable review card) */
            <div ref={reviewResultRef} className="space-y-5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">
                    Your Review
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Crafted from your experience. You can edit before copying.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                    Draft #{generationNumber}
                  </span>
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                    {calculateWords(generatedDraft)} words
                  </span>
                </div>
              </div>

              {/* Large Readable Review Textarea (Section 31: comfortable line-height, 80-150 words) */}
              <div className="space-y-1">
                <textarea
                  ref={textAreaRef}
                  rows={6}
                  value={generatedDraft}
                  onChange={(e) => {
                    setGeneratedDraft(e.target.value);
                    setWordCount(calculateWords(e.target.value));
                  }}
                  placeholder="Your review text..."
                  className="w-full p-4 sm:p-5 rounded-2xl border-2 border-slate-200 bg-white text-slate-900 text-sm sm:text-base leading-relaxed outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100/50 transition-all font-sans"
                />
              </div>

              {/* Copy Feedback Banner (Section 32) */}
              {copyFeedback && (
                <div
                  className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2.5 animate-in fade-in duration-150 ${
                    copied
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-blue-50 border-blue-200 text-blue-800'
                  }`}
                >
                  {copied ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <Copy className="w-4 h-4 text-blue-600 shrink-0" />
                  )}
                  <span>{copyFeedback}</span>
                </div>
              )}

              {/* Regeneration Error Banner */}
              {generationError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{generationError}</span>
                </div>
              )}

              {/* Action Buttons: Copy Review, Regenerate, Open Google Review (Section 30, 32, 33) */}
              <div className="space-y-3 pt-1">
                {/* 1. Copy Review */}
                <button
                  type="button"
                  onClick={handleCopy}
                  className="w-full py-3.5 px-5 rounded-xl font-bold text-sm bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  <span>{copied ? 'Review Copied' : 'Copy Review'}</span>
                </button>

                {/* 2. Regenerate & Edit Buttons */}
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleGenerateDraft(true)}
                    disabled={isRegenerating || generating}
                    className="py-3 px-4 rounded-xl font-semibold text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin text-blue-600' : ''}`}
                    />
                    <span>{isRegenerating ? 'Creating another version...' : 'Regenerate'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => textAreaRef.current?.focus()}
                    className="py-3 px-4 rounded-xl font-semibold text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                    <span>Edit Review</span>
                  </button>
                </div>

                {/* 3. Open Google Review */}
                <button
                  type="button"
                  id="openGoogleReviewDestinationButton"
                  onClick={handleOpenGoogle}
                  className="w-full py-4 px-6 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99] cursor-pointer"
                >
                  <span>Open Google Review</span>
                  <ExternalLink className="w-4 h-4 opacity-80" />
                </button>

                {/* 4. Start Over */}
                <div className="pt-2 border-t border-slate-100 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setShowResetModal(true)}
                    className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1.5 cursor-pointer py-1 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Start Over With Fresh Experience</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Minimal Customer Notice (Section 21) */}
        <footer className="text-center px-4 py-2 space-y-1">
          <p className="text-[11px] text-slate-400">
            Reviews are submitted by customers directly on Google. ReviewFlow AI is a writing assistant.
          </p>
        </footer>
      </div>

      {/* Start Over Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl border border-slate-200">
            <h3 className="font-bold text-slate-900 text-base">Start Over?</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              This will clear your written experience and current review draft.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetSession}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer shadow-xs"
              >
                Start Over
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
