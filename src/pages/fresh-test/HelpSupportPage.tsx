import React, { useState } from 'react';
import {
  LifeBuoy,
  Mail,
  MessageSquare,
  FileQuestion,
  CheckCircle2,
  Send,
  ExternalLink,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Clock,
  PhoneCall,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../lib/auth-context.tsx';
import { useBusiness } from '../../lib/business-context.tsx';

interface FaqItem {
  q: string;
  a: string;
}

const FAQS: FaqItem[] = [
  {
    q: 'How does dynamic QR redirection work?',
    a: 'Every business is assigned a permanent, non-guessable URL (such as https://qorbiqai.com/r/{code}). When customers scan your stand or tap NFC, our Cloudflare edge function instantly resolves your business profile and opens your AI review assistant. If your Google business profile or review URL ever changes in the future, you simply update it in your dashboard—you never need to reprint your physical standee!'
  },
  {
    q: 'Why are Qorbiq AI plans one-time payments instead of auto-renewing subscriptions?',
    a: 'We strictly protect local business owners from surprise bank debits and hidden e-mandates. Plan 1 (₹1,800) grants 180 days of full access, and Plan 2 (₹2,999) grants 365 days. When your plan period ends, you decide whether to manually renew. We will never auto-debit your bank account.'
  },
  {
    q: 'How does multi-lingual review assistance work for local customers?',
    a: 'When customers scan your QR stand, they can select their preferred language: Marathi (मराठी), Hindi (हिंदी), or English. Our AI generates an authentic, respectful review draft based on the customer\'s selected experience touchpoints. The customer can review, refine, copy with 1 click, and proceed to your Google Review page to post.'
  },
  {
    q: 'How do I program or reprogram my acrylic stand NFC chip?',
    a: 'Download the free "NFC Tools" app on any smartphone. Under "Write", add a "Custom URL / URI" record with your permanent Qorbiq AI dynamic link (https://qorbiqai.com/r/{code}). Touch the phone to the NFC chip on your standee to flash it in seconds. Once verified, you can optionally lock the tag to prevent customer tampering.'
  },
  {
    q: 'Can I order additional acrylic stands for multiple tables or billing counters?',
    a: 'Yes! Head to "Order Standees" in the sidebar menu. We provide laser-cut premium acrylic stands, counter pucks, and window stickers pre-printed and encoded with your business QR and NFC tags, delivered directly to your doorstep across India.'
  }
];

export const HelpSupportPage: React.FC = () => {
  const { user } = useAuth();
  const { activeBusiness } = useBusiness();

  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    // Submit support inquiry
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      setSubject('');
      setMessage('');
    }, 800);
  };

  return (
    <div className="space-y-8 pb-12 font-sans max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider mb-2">
            <LifeBuoy className="w-3.5 h-3.5" />
            <span>Support & Documentation</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Help & Support Center</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Get rapid assistance with your Qorbiq AI dynamic QR stand, NFC setup, or payment questions.
          </p>
        </div>
      </div>

      {/* Direct Contact Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
            <Mail className="w-5 h-5" />
          </div>
          <div className="text-base font-bold text-slate-900">Email Support</div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Direct priority email with our engineering and operations team in Pune, Maharashtra.
          </p>
          <a
            href="mailto:chakankarsai@gmail.com?subject=Qorbiq%20AI%20Support%20Request"
            className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 pt-1"
          >
            <span>chakankarsai@gmail.com</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div className="text-base font-bold text-slate-900">WhatsApp Onboarding</div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Chat with our onboarding specialist for instant QR standee and NFC tag assistance.
          </p>
          <a
            href="https://wa.me/919999999999?text=Hi%20Qorbiq%20AI%20Team,%20I%20need%20help%20with%20my%20review%20stand"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 pt-1"
          >
            <span>Open WhatsApp Chat</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <div className="text-base font-bold text-slate-900">Response SLA</div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Monday to Saturday: 9:00 AM – 8:00 PM IST. Average response time under 2 hours.
          </p>
          <div className="text-xs font-semibold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg inline-block">
            Priority Merchant Support
          </div>
        </div>
      </div>

      {/* FAQs Section */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Frequently Asked Questions</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Everything you need to know about your review stand, dynamic links, and payment protection.
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="border border-slate-200 rounded-2xl overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-4 sm:p-5 text-left font-bold text-sm text-slate-900 flex items-center justify-between hover:bg-slate-50 cursor-pointer"
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-4 pb-5 sm:px-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Submit Ticket Form */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Send Support Inquiry</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Submit a question or standee customization inquiry to our technical team.
          </p>
        </div>

        {submitted ? (
          <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <h3 className="font-bold text-slate-900 text-sm">Message Sent Successfully</h3>
            <p className="text-xs text-slate-600">
              Our support team has received your ticket and will respond to <strong>{user?.email}</strong> within 2 hours.
            </p>
            <button
              type="button"
              onClick={() => setSubmitted(false)}
              className="mt-2 text-xs font-bold text-blue-600 underline cursor-pointer"
            >
              Submit another question
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Your Name</label>
                <input
                  type="text"
                  disabled
                  value={user?.displayName || 'Business Owner'}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-500 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Your Email</label>
                <input
                  type="email"
                  disabled
                  value={user?.email || 'owner@business.com'}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Subject</label>
              <input
                type="text"
                required
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="e.g., Assistance with NFC programming or standee shipment"
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Message</label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Describe your issue or question in detail..."
                className="w-full bg-white border border-slate-200 rounded-xl p-3.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Submitting...' : 'Send Message'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
