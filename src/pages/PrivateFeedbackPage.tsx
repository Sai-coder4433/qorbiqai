import React, { useState } from 'react';
import {
  MessageCircleQuestion,
  Star,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Send,
  Sliders,
  Check
} from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout.tsx';
import { useUi } from '../lib/ui-context.tsx';

export const PrivateFeedbackPage: React.FC = () => {
  const { business: uiBiz } = useUi();
  const [feedbacks, setFeedbacks] = useState([
    {
      id: 'fb_1',
      customerName: 'Gajanan Deshmukh',
      customerContact: '+91 98901 23456',
      rating: 3,
      comment: 'Materials were genuine, but delivery to our Bhosari unit was delayed by 2 hours on Friday.',
      createdAt: '2026-09-24T15:30:00Z',
      status: 'RESOLVED'
    },
    {
      id: 'fb_2',
      customerName: 'Anonymous Contractor',
      customerContact: 'Not provided',
      rating: 4,
      comment: 'Kindly keep more 3-phase Siemens contactors in stock during month-end breakdown rush.',
      createdAt: '2026-09-22T11:45:00Z',
      status: 'PENDING'
    }
  ]);

  const handleUpdateStatus = (id: string, status: string) => {
    setFeedbacks(prev =>
      prev.map(f => (f.id === id ? { ...f, status } : f))
    );
  };

  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-[#E5E7EB] mb-6 gap-4">
        <div>
          <h1 className="text-2xl sm:text-[28px] font-semibold text-[#202124] tracking-tight">
            Private Feedback
          </h1>
          <p className="text-xs sm:text-sm text-[#5F6368] mt-0.5">
            Internal customer feedback captured through NFC/QR portals for store management.
          </p>
          <p className="text-xs text-[#5F6368] mt-1 font-medium">
            Atharv Electricals · Chakan
          </p>
        </div>
      </div>

      <div className="p-3.5 bg-white border border-[#E5E7EB] rounded-xl mb-6 text-xs text-[#5F6368] flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-[#188038] shrink-0" />
        <span>
          <strong>Google Compliance Note:</strong> Private feedback runs independently and is non-gated. It does not replace or suppress public Google Maps reviews.
        </span>
      </div>

      <div className="space-y-3">
        {feedbacks.map(f => (
          <div key={f.id} className="bg-white border border-[#E5E7EB] rounded-xl p-5 hover:border-[#1A73E8]/30 transition-colors text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#E5E7EB] gap-2">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-[#202124]">{f.customerName}</span>
                <span className="text-[#5F6368]">({f.customerContact})</span>
                <span className="text-[11px] text-[#80868B]">
                  {new Date(f.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 font-semibold text-[#202124]">
                  <span>{f.rating}</span>
                  <Star className="w-3.5 h-3.5 text-[#FBBC04] fill-[#FBBC04]" />
                </div>

                <select
                  value={f.status}
                  onChange={e => handleUpdateStatus(f.id, e.target.value)}
                  className="bg-[#F8FAFC] border border-[#E5E7EB] rounded-lg py-1 px-2 font-medium text-[#202124] cursor-pointer"
                >
                  <option value="PENDING">Pending Review</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved ✓</option>
                </select>
              </div>
            </div>

            <p className="text-xs text-[#202124] my-3 leading-relaxed">
              "{f.comment}"
            </p>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
};

export const BusinessSettingsPage: React.FC = () => {
  const { business: uiBiz, updateBusiness } = useUi();
  const [tone, setTone] = useState('Professional');
  const [customInstructions, setCustomInstructions] = useState('Thank customers for choosing Atharv Electricals. Emphasize ISI certified products, warranty, and licensed site support.');
  const [chipsText, setChipsText] = useState('Genuine Products, Prompt Site Support, Transparent Pricing, Industrial Grade Cables, Licensed Electricians');
  const [googleReviewUrl, setGoogleReviewUrl] = useState('https://search.google.com/local/writereview?placeid=ChIJ_AtharvPlaceId');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const chips = chipsText.split(',').map(s => s.trim()).filter(Boolean);
    updateBusiness({
      reviewTone: tone,
      experienceChips: chips
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <DashboardLayout>
      {/* Settings Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-[#E5E7EB] mb-6 gap-4">
        <div>
          <h1 className="text-2xl sm:text-[28px] font-semibold text-[#202124] tracking-tight">
            Business Settings
          </h1>
          <p className="text-xs sm:text-sm text-[#5F6368] mt-0.5">
            Configure Gemini AI review tone directives and NFC experience chips.
          </p>
          <p className="text-xs text-[#5F6368] mt-1 font-medium">
            Atharv Electricals · Chakan
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white border border-[#E5E7EB] rounded-xl p-6 max-w-2xl space-y-5 text-xs">
        <div>
          <label className="block font-medium text-xs text-[#202124] mb-2">
            Default AI Review Response Style
          </label>
          <div className="grid grid-cols-3 gap-2">
            {['Professional', 'Warm', 'Concise'].map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setTone(t)}
                className={`py-2 px-3 rounded-lg border text-xs font-medium text-center transition-colors ${
                  tone === t
                    ? 'bg-[#1A73E8] text-white border-[#1A73E8]'
                    : 'bg-white text-[#5F6368] border-[#E5E7EB] hover:bg-[#F8FAFC]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block font-medium text-xs text-[#202124] mb-1.5">
            Custom Brand Directives & Safety Guardrails
          </label>
          <textarea
            rows={3}
            value={customInstructions}
            onChange={e => setCustomInstructions(e.target.value)}
            className="w-full p-3 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1A73E8] text-xs text-[#202124]"
          />
        </div>

        <div>
          <label className="block font-medium text-xs text-[#202124] mb-1.5">
            Customer Experience Chips for NFC/QR Flow (Comma-separated)
          </label>
          <input
            type="text"
            value={chipsText}
            onChange={e => setChipsText(e.target.value)}
            className="w-full p-2.5 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1A73E8] text-xs text-[#202124]"
          />
        </div>

        <div>
          <label className="block font-medium text-xs text-[#202124] mb-1.5">
            Google Review URL
          </label>
          <input
            type="url"
            value={googleReviewUrl}
            onChange={e => setGoogleReviewUrl(e.target.value)}
            className="w-full p-2.5 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1A73E8] text-xs text-[#202124]"
          />
        </div>

        <div className="pt-4 border-t border-[#E5E7EB] flex items-center justify-between">
          {saved && (
            <span className="text-xs text-[#188038] font-medium flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              Settings saved successfully
            </span>
          )}
          <button
            type="submit"
            className="ml-auto px-5 py-2 bg-[#1A73E8] hover:bg-[#1557B0] text-white rounded-lg font-medium text-xs transition-colors"
          >
            Save Settings
          </button>
        </div>
      </form>
    </DashboardLayout>
  );
};
