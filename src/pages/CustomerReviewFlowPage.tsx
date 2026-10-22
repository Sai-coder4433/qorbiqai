import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Star,
  ExternalLink,
  MessageSquare,
  Copy,
  Check,
  Send,
  RotateCw,
  Edit3,
  Globe,
  Info,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { fetchApi } from '../lib/api.ts';
import { useTranslation, LanguageCode } from '../lib/i18n.tsx';

export const CustomerReviewFlowPage: React.FC = () => {
  const { businessSlug } = useParams<{ businessSlug: string }>();
  const { t, language, setLanguage, availableLanguages } = useTranslation();

  const [rating, setRating] = useState<number | null>(null);
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [customerNote, setCustomerNote] = useState('');
  const [draftReview, setDraftReview] = useState('');
  const [isEditingDraft, setIsEditingDraft] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hasVisitedGoogle, setHasVisitedGoogle] = useState(false);
  const [postedConfirmation, setPostedConfirmation] = useState<'yes' | 'not_yet' | null>(null);

  // Private feedback modal state
  const [showPrivateModal, setShowPrivateModal] = useState(false);
  const [privateName, setPrivateName] = useState('');
  const [privateContact, setPrivateContact] = useState('');
  const [privateFeedback, setPrivateFeedback] = useState('');
  const [privateSubmitting, setPrivateSubmitting] = useState(false);
  const [privateSubmitted, setPrivateSubmitted] = useState(false);

  // Business info state
  const businessName = 'Atharv Electricals';
  const businessAddress = 'Talegaon-Chakan Rd, Opp. MIDC Phase II, Chakan, Pune';
  // Real Google Maps write review URL
  const googleReviewUrl = 'https://search.google.com/local/writereview?placeid=ChIJW3P1zP_PwjsR_6Z-O9xT1k0';

  // Configured feedback chips
  const feedbackChips = [
    'Fast Service',
    'Helpful Staff',
    'Good Product Quality',
    'Fair Pricing',
    'Quick Response',
    'Professional Service'
  ];

  useEffect(() => {
    // Log QR_OPENED event
    try {
      fetchApi('/review-events', {
        method: 'POST',
        body: JSON.stringify({
          eventType: 'QR_OPENED',
          businessSlug: businessSlug || 'atharv-electricals',
          timestamp: new Date().toISOString()
        })
      }).catch(() => {});
    } catch (e) {}
  }, [businessSlug]);

  const handleRatingSelect = (selectedStar: number) => {
    setRating(selectedStar);
    // Log RATING_SELECTED
    try {
      fetchApi('/review-events', {
        method: 'POST',
        body: JSON.stringify({
          eventType: 'RATING_SELECTED',
          rating: selectedStar,
          businessSlug: businessSlug || 'atharv-electricals'
        })
      }).catch(() => {});
    } catch (e) {}
  };

  const toggleChip = (chip: string) => {
    setSelectedChips(prev => {
      const next = prev.includes(chip) ? prev.filter(c => c !== chip) : [...prev, chip];
      // Log CHIPS_SELECTED
      try {
        fetchApi('/review-events', {
          method: 'POST',
          body: JSON.stringify({
            eventType: 'CHIPS_SELECTED',
            chips: next,
            businessSlug: businessSlug || 'atharv-electricals'
          })
        }).catch(() => {});
      } catch (e) {}
      return next;
    });
  };

  // Generate Review Draft without hallucinating facts
  const [generatingDraft, setGeneratingDraft] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generationIteration, setGenerationIteration] = useState(1);

  const generateDraft = async () => {
    if (generatingDraft) return;
    try {
      setGeneratingDraft(true);
      setGenerationError(null);
      const nextIter = generationIteration + 1;
      const langMap: Record<string, string> = { en: 'English', hi: 'Hindi', mr: 'Marathi' };
      const selectedLang = langMap[language] || 'English';

      const res = await fetch('/api/ai/review-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'req_' + Date.now(),
          customerText: customerNote.trim(),
          customerFeedback: customerNote.trim(),
          selectedTopics: selectedChips,
          language: selectedLang,
          businessName,
          generationNumber: nextIter
        })
      });

      const data = await res.json();
      if (!res.ok || !data.draft) {
        throw new Error(data.error || 'Unable to generate a new review right now Please try again');
      }

      setDraftReview(data.draft);
      setGenerationIteration(nextIter);
      setIsEditingDraft(false);

      fetchApi('/review-events', {
        method: 'POST',
        body: JSON.stringify({
          eventType: 'REVIEW_GENERATED',
          rating,
          chips: selectedChips,
          language
        })
      }).catch(() => {});
    } catch (err: any) {
      setGenerationError(err.message || 'Unable to generate a new review right now Please try again');
    } finally {
      setGeneratingDraft(false);
    }
  };

  const handleCopyReview = () => {
    if (!draftReview) return;
    navigator.clipboard.writeText(draftReview);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);

    try {
      fetchApi('/review-events', {
        method: 'POST',
        body: JSON.stringify({
          eventType: 'REVIEW_COPIED',
          reviewTextLength: draftReview.length
        })
      }).catch(() => {});
    } catch (e) {}
  };

  const handleContinueToGoogle = () => {
    setHasVisitedGoogle(true);
    try {
      fetchApi('/review-events', {
        method: 'POST',
        body: JSON.stringify({
          eventType: 'GOOGLE_REVIEW_OPENED',
          rating
        })
      }).catch(() => {});
    } catch (e) {}
    window.open(googleReviewUrl, '_blank', 'noopener,noreferrer');
  };

  const handlePrivateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!privateFeedback.trim()) return;
    setPrivateSubmitting(true);
    try {
      await fetchApi('/private-feedback', {
        method: 'POST',
        body: JSON.stringify({
          businessId: 'biz_001',
          rating: rating || 3,
          message: privateFeedback,
          customerName: privateName || 'Customer',
          customerEmail: privateContact || undefined
        })
      });
      setPrivateSubmitted(true);
      setTimeout(() => {
        setShowPrivateModal(false);
        setPrivateSubmitted(false);
        setPrivateFeedback('');
      }, 2500);
    } catch (e) {
      console.warn('Private feedback submit:', e);
    } finally {
      setPrivateSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#202124] flex flex-col justify-between py-6 px-4 font-sans antialiased">
      {/* Top Bar with Language Selector */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between mb-4 px-1 text-xs">
        <span className="text-[#5F6368] font-medium">Customer Feedback Portal</span>
        <div className="flex items-center gap-1 bg-white border border-[#E0E3E7] rounded-lg p-1 shadow-2xs">
          <Globe className="w-3.5 h-3.5 text-[#5F6368] ml-1" />
          {availableLanguages.map(lang => (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                language === lang.code ? 'bg-[#E8F0FE] text-[#1A73E8] font-semibold' : 'text-[#5F6368] hover:text-[#202124]'
              }`}
            >
              {lang.nativeLabel}
            </button>
          ))}
        </div>
      </div>

      {/* Main Review Card */}
      <div className="max-w-md w-full mx-auto bg-white border border-[#E0E3E7] rounded-2xl p-6 sm:p-7 shadow-xs space-y-6">
        {/* Business Header */}
        <div className="text-center pb-5 border-b border-[#E0E3E7]">
          <div className="w-14 h-14 rounded-2xl bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center font-bold text-lg mx-auto mb-3 shadow-2xs">
            AE
          </div>
          <h1 className="text-xl font-semibold text-[#202124] tracking-tight">{businessName}</h1>
          <p className="text-xs text-[#5F6368] mt-1">{businessAddress}</p>
        </div>

        {/* Rating Question */}
        <div className="text-center space-y-3">
          <h2 className="text-base font-semibold text-[#202124]">
            {t('review_flow.heading', 'How was your experience?')}
          </h2>
          <p className="text-xs text-[#5F6368]">
            {t('review_flow.select_rating', 'Tap a star to rate your visit')}
          </p>

          {/* Clean 1-5 Star Selector (Strict anti-slop: clean outline / fill, no decorative sparkles) */}
          <div className="flex items-center justify-center gap-2 pt-1">
            {[1, 2, 3, 4, 5].map(starNum => {
              const isSelected = rating !== null && starNum <= rating;
              return (
                <button
                  key={starNum}
                  type="button"
                  onClick={() => handleRatingSelect(starNum)}
                  className="p-1.5 focus:outline-none transition-transform hover:scale-105 active:scale-95"
                  aria-label={`Rate ${starNum} stars out of 5`}
                >
                  <Star
                    className={`w-9 h-9 transition-colors ${
                      isSelected
                        ? 'text-[#F9AB00] fill-[#F9AB00]'
                        : 'text-[#DADCE0] hover:text-[#F9AB00]'
                    }`}
                  />
                </button>
              );
            })}
          </div>

          {rating !== null && (
            <div className="text-xs font-semibold text-[#202124] pt-1">
              {rating === 5 && '★★★★★ Excellent'}
              {rating === 4 && '★★★★☆ Very Good'}
              {rating === 3 && '★★★☆☆ Average'}
              {rating === 2 && '★★☆☆☆ Needs Improvement'}
              {rating === 1 && '★☆☆☆☆ Poor'}
            </div>
          )}
        </div>

        {/* After Rating is Selected */}
        {rating !== null && rating <= 3 && (
          <div className="space-y-4 pt-2 animate-in fade-in duration-200">
            <div className="p-4 bg-[#FEF7E0] border border-[#F9AB00]/40 rounded-xl space-y-1.5 text-center">
              <h4 className="text-sm font-bold text-[#B06000]">We want to make this right</h4>
              <p className="text-xs text-[#5F6368]">
                We are genuinely sorry your experience was not 5 stars. Please share your feedback directly with our management team so we can resolve this immediately.
              </p>
            </div>

            {privateSubmitted ? (
              <div className="p-6 bg-[#E6F4EA] border border-[#CEEAD6] text-[#137333] rounded-xl text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 mx-auto" />
                <p className="text-sm font-semibold">Thank you for your feedback.</p>
                <p className="text-xs text-[#5F6368]">
                  Your message has been dispatched to store management via WhatsApp and Email for immediate resolution.
                </p>
              </div>
            ) : (
              <form onSubmit={handlePrivateSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block font-medium text-[#202124] mb-1">What went wrong? *</label>
                  <textarea
                    rows={3}
                    required
                    value={privateFeedback}
                    onChange={e => setPrivateFeedback(e.target.value)}
                    placeholder="Tell us what happened and how we can improve..."
                    className="w-full p-2.5 border border-[#E0E3E7] rounded-lg focus:outline-none focus:border-[#1A73E8]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-medium text-[#202124] mb-1">Your Name</label>
                    <input
                      type="text"
                      value={privateName}
                      onChange={e => setPrivateName(e.target.value)}
                      placeholder="e.g. Rahul Patil"
                      className="w-full p-2 border border-[#E0E3E7] rounded-lg focus:outline-none focus:border-[#1A73E8]"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-[#202124] mb-1">Phone / WhatsApp</label>
                    <input
                      type="text"
                      value={privateContact}
                      onChange={e => setPrivateContact(e.target.value)}
                      placeholder="+91 98..."
                      className="w-full p-2 border border-[#E0E3E7] rounded-lg focus:outline-none focus:border-[#1A73E8]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={privateSubmitting || !privateFeedback.trim()}
                  className="w-full py-2.5 bg-[#1A73E8] hover:bg-[#1557B0] text-white font-semibold rounded-lg shadow-2xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{privateSubmitting ? 'Sending to Manager...' : 'Send Direct to Manager'}</span>
                </button>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={handleContinueToGoogle}
                    className="text-[11px] text-[#5F6368] hover:text-[#202124] underline"
                  >
                    I still wish to post a public review on Google Maps
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Positive 4-5 Stars Experience */}
        {rating !== null && rating >= 4 && (
          <div className="space-y-5 pt-2 animate-in fade-in duration-200">
            {/* Feedback Chips */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-[#202124]">
                {t('review_flow.chips_label', 'What stood out during your visit?')}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {feedbackChips.map(chip => {
                  const isSelected = selectedChips.includes(chip);
                  return (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => toggleChip(chip)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        isSelected
                          ? 'bg-[#1A73E8] border-[#1A73E8] text-white'
                          : 'bg-[#F8F9FA] border-[#E0E3E7] text-[#5F6368] hover:text-[#202124]'
                      }`}
                    >
                      {chip}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optional Customer Note */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-[#202124]">
                Specific comments or details (Optional)
              </label>
              <input
                type="text"
                value={customerNote}
                onChange={e => setCustomerNote(e.target.value)}
                placeholder="e.g. wire sizing help, quick billing, specific staff..."
                className="w-full text-xs px-3 py-2 border border-[#E0E3E7] rounded-lg focus:outline-none focus:border-[#1A73E8]"
              />
            </div>

            {/* AI Review Draft Generator */}
            <div className="space-y-2">
              {generationError && (
                <div className="p-2.5 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg">
                  {generationError}
                </div>
              )}
              {!draftReview ? (
                <button
                  type="button"
                  disabled={generatingDraft}
                  onClick={generateDraft}
                  className="w-full py-2.5 px-4 bg-[#E8F0FE] hover:bg-[#D2E3FC] text-[#1A73E8] disabled:opacity-50 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>{generatingDraft ? 'Generating with AI...' : t('review_flow.generate_draft', 'Draft review with AI')}</span>
                </button>
              ) : (
                <div className="bg-[#F8F9FA] border border-[#E0E3E7] rounded-xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-[#5F6368] uppercase tracking-wider">
                      Generated Draft (Based on your rating &amp; selections)
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={generatingDraft}
                        onClick={generateDraft}
                        className="text-[11px] text-[#1A73E8] hover:underline flex items-center gap-1 font-medium disabled:opacity-50"
                      >
                        <RotateCw className={`w-3 h-3 ${generatingDraft ? 'animate-spin' : ''}`} />
                        <span>{generatingDraft ? 'Regenerating...' : 'Regenerate'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingDraft(!isEditingDraft)}
                        className="text-[11px] text-[#5F6368] hover:text-[#202124] flex items-center gap-1 font-medium"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>{isEditingDraft ? 'Done' : 'Edit'}</span>
                      </button>
                    </div>
                  </div>

                  {isEditingDraft ? (
                    <textarea
                      rows={3}
                      value={draftReview}
                      onChange={e => setDraftReview(e.target.value)}
                      className="w-full text-xs p-2 bg-white border border-[#E0E3E7] rounded-lg focus:outline-none focus:border-[#1A73E8]"
                    />
                  ) : (
                    <p className="text-xs text-[#202124] leading-relaxed italic bg-white p-2.5 rounded-lg border border-[#E0E3E7]/60">
                      "{draftReview}"
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={handleCopyReview}
                      className="px-3 py-1.5 bg-white border border-[#E0E3E7] hover:bg-[#F8F9FA] text-xs font-semibold text-[#202124] rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-[#188038]" /> : <Copy className="w-3.5 h-3.5 text-[#5F6368]" />}
                      <span>{copied ? t('review_flow.copied', 'Review copied!') : t('review_flow.copy_review', 'Copy Review')}</span>
                    </button>
                    <span className="text-[11px] text-[#5F6368]">Ready to paste on Google</span>
                  </div>
                </div>
              )}
            </div>

            {/* Strict Anti-Gate Guarantee: Both Google Review and Private Feedback are accessible */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={handleContinueToGoogle}
                className="w-full py-3 px-4 bg-[#1A73E8] hover:bg-[#1557B0] text-white text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-2xs"
              >
                <span>{t('review_flow.continue_google', 'Continue to Google to Post')}</span>
                <ExternalLink className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setShowPrivateModal(true)}
                className="w-full py-2.5 px-4 bg-white border border-[#E0E3E7] hover:bg-[#F8FAFC] text-xs font-medium text-[#5F6368] hover:text-[#202124] rounded-xl transition-colors flex items-center justify-center gap-1.5"
              >
                <span>{t('review_flow.private_feedback_title', 'Send Private Feedback to Owner')}</span>
              </button>
            </div>

            {/* Post-Handoff Status Check */}
            {hasVisitedGoogle && !postedConfirmation && (
              <div className="p-3.5 bg-[#F8F9FA] border border-[#E0E3E7] rounded-xl text-center space-y-2">
                <p className="text-xs font-semibold text-[#202124]">Did you post your review on Google?</p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setPostedConfirmation('yes')}
                    className="px-3.5 py-1.5 bg-[#188038] text-white text-xs font-semibold rounded-lg hover:bg-[#137333]"
                  >
                    Yes, I posted
                  </button>
                  <button
                    type="button"
                    onClick={() => setPostedConfirmation('not_yet')}
                    className="px-3.5 py-1.5 bg-white border border-[#E0E3E7] text-[#5F6368] text-xs font-semibold rounded-lg hover:bg-[#F1F3F4]"
                  >
                    Not yet
                  </button>
                </div>
              </div>
            )}

            {postedConfirmation === 'yes' && (
              <div className="p-3 bg-[#E6F4EA] border border-[#CEEAD6] text-[#137333] rounded-xl text-xs flex items-center justify-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Thank you! Your feedback will reflect in our Google profile after processing.</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Private Feedback Modal */}
      {showPrivateModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#E0E3E7] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E0E3E7]">
              <div>
                <h3 className="text-sm font-semibold text-[#202124]">
                  {t('review_flow.private_feedback_title', 'Send Private Feedback to Owner')}
                </h3>
                <p className="text-xs text-[#5F6368] mt-0.5">
                  {t('review_flow.private_feedback_desc', 'Have an issue or private suggestion? Send it directly to management.')}
                </p>
              </div>
              <button
                onClick={() => setShowPrivateModal(false)}
                className="text-[#5F6368] hover:text-[#202124] text-xs p-1"
              >
                ✕
              </button>
            </div>

            {privateSubmitted ? (
              <div className="py-8 text-center space-y-2 text-[#137333]">
                <CheckCircle2 className="w-8 h-8 mx-auto" />
                <p className="text-xs font-semibold">
                  {t('review_flow.private_success', 'Thank you! Your feedback has been sent directly to the store manager.')}
                </p>
              </div>
            ) : (
              <form onSubmit={handlePrivateSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block font-medium text-[#202124] mb-1">Your Feedback / Suggestion *</label>
                  <textarea
                    rows={4}
                    required
                    value={privateFeedback}
                    onChange={e => setPrivateFeedback(e.target.value)}
                    placeholder="Tell us what happened and how we can make it right..."
                    className="w-full p-2.5 border border-[#E0E3E7] rounded-lg focus:outline-none focus:border-[#1A73E8]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-medium text-[#202124] mb-1">Your Name (Optional)</label>
                    <input
                      type="text"
                      value={privateName}
                      onChange={e => setPrivateName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full p-2 border border-[#E0E3E7] rounded-lg focus:outline-none focus:border-[#1A73E8]"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-[#202124] mb-1">Phone or Email (Optional)</label>
                    <input
                      type="text"
                      value={privateContact}
                      onChange={e => setPrivateContact(e.target.value)}
                      placeholder="For manager follow-up"
                      className="w-full p-2 border border-[#E0E3E7] rounded-lg focus:outline-none focus:border-[#1A73E8]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPrivateModal(false)}
                    className="px-3.5 py-2 border border-[#E0E3E7] text-[#5F6368] rounded-lg hover:bg-[#F8F9FA]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={privateSubmitting || !privateFeedback.trim()}
                    className="px-4 py-2 bg-[#1A73E8] text-white font-semibold rounded-lg hover:bg-[#1557B0] disabled:opacity-50"
                  >
                    {privateSubmitting ? 'Sending...' : t('review_flow.submit_private', 'Submit Private Feedback')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="max-w-md w-full mx-auto text-center text-[11px] text-[#80868B] py-2">
        <span>Verified Google Business Profile Integration · LOCALOS AI</span>
      </div>
    </div>
  );
};

export { AutomationsPage } from './AutomationsPage.tsx';
