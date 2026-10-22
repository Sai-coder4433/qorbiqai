import React, { useState } from 'react';
import {
  FileText,
  Sparkles,
  Plus,
  Calendar,
  Send,
  Image as ImageIcon,
  CheckCircle2,
  X,
  Upload,
  ExternalLink
} from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout.tsx';
import { useUi } from '../lib/ui-context.tsx';

export const PostsPage: React.FC = () => {
  const { business: uiBiz } = useUi();
  const [showModal, setShowModal] = useState(false);
  const [topicType, setTopicType] = useState('STANDARD');
  const [factsInput, setFactsInput] = useState('');
  const [summary, setSummary] = useState('');
  const [ctaType, setCtaType] = useState('CALL');
  const [generating, setGenerating] = useState(false);

  const [posts, setPosts] = useState([
    {
      id: 'post_1',
      topicType: 'OFFER',
      summary: 'Special contractor pricing on Polycab HT/LT armored power cables for manufacturing setups in Chakan MIDC Phase II. Ready stock available for same-day delivery.',
      status: 'PUBLISHED',
      publishedAt: '2026-09-25T11:00:00Z',
      callToAction: { actionType: 'CALL', url: 'tel:+919822014820' }
    },
    {
      id: 'post_2',
      topicType: 'STANDARD',
      summary: 'Authorized distributor for Schneider Electric & L&T industrial switchgears, air circuit breakers (ACB), and motor protection starters. Complete warranty documentation provided.',
      status: 'PUBLISHED',
      publishedAt: '2026-09-18T09:30:00Z',
      callToAction: { actionType: 'LEARN_MORE', url: 'https://atharvaelectricals.in' }
    },
    {
      id: 'post_3',
      topicType: 'EVENT',
      summary: 'Visiting the Chakan Industrial Expo next week? Meet our senior electrical engineers to discuss turnkey sub-station setup and factory panel automation.',
      status: 'SCHEDULED',
      publishedAt: '2026-09-28T10:00:00Z',
      callToAction: { actionType: 'SIGN_UP', url: 'https://atharvaelectricals.in/events' }
    }
  ]);

  const handleGenerateAiPost = () => {
    setGenerating(true);
    setTimeout(() => {
      setSummary(`Atharv Electricals announcement: Authorized supply of certified industrial control switchgears and heavy-duty cabling for Chakan factories. Prompt site delivery with full manufacturer warranty. Contact our technical team today.`);
      setGenerating(false);
    }, 400);
  };

  const handlePublish = () => {
    if (!summary.trim()) return;
    const newPost = {
      id: `post_${Date.now()}`,
      topicType,
      summary,
      status: 'PUBLISHED',
      publishedAt: new Date().toISOString(),
      callToAction: { actionType: ctaType, url: 'https://atharvaelectricals.in' }
    };
    setPosts([newPost, ...posts]);
    setShowModal(false);
    setSummary('');
    setFactsInput('');
  };

  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-[#E5E7EB] mb-6 gap-4">
        <div>
          <h1 className="text-2xl sm:text-[28px] font-semibold text-[#202124] tracking-tight">
            Google Posts
          </h1>
          <p className="text-xs sm:text-sm text-[#5F6368] mt-0.5">
            Publish updates, offers and announcements directly to Google Search & Maps.
          </p>
          <p className="text-xs text-[#5F6368] mt-1 font-medium">
            Atharv Electricals · Chakan
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1A73E8] hover:bg-[#1557B0] text-white text-xs font-medium rounded-lg transition-colors self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create Post</span>
        </button>
      </div>

      {/* Post Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {posts.map(p => (
          <div
            key={p.id}
            className="bg-white border border-[#E5E7EB] rounded-xl p-5 hover:border-[#1A73E8]/30 transition-colors flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-[11px] text-[#1A73E8] bg-[#E8F0FE] px-2 py-0.5 rounded">
                  {p.topicType}
                </span>
                <span className="text-[11px] text-[#5F6368]">
                  {new Date(p.publishedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </span>
              </div>
              <p className="text-xs text-[#202124] leading-relaxed mt-2">
                {p.summary}
              </p>
            </div>

            <div className="pt-4 mt-4 border-t border-[#E5E7EB] flex items-center justify-between text-xs">
              <span className="text-[11px] text-[#188038] font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{p.status}</span>
              </span>
              <span className="text-[11px] text-[#5F6368]">
                Button: {p.callToAction.actionType}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Create Post Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-[#E5E7EB]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB] mb-4">
              <h3 className="text-sm font-semibold text-[#202124]">New Google Post</h3>
              <button onClick={() => setShowModal(false)} className="text-[#5F6368] hover:text-[#202124]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-medium text-[#202124] mb-1">Post Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {['STANDARD', 'OFFER', 'EVENT'].map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTopicType(t)}
                      className={`py-1.5 px-3 rounded-lg border text-center transition-colors ${
                        topicType === t ? 'bg-[#1A73E8] border-[#1A73E8] text-white font-medium' : 'bg-white border-[#E5E7EB] text-[#5F6368]'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-[#202124]">Announcement Facts / Highlights</label>
                  <button
                    onClick={handleGenerateAiPost}
                    disabled={generating}
                    className="text-[11px] text-[#1A73E8] hover:underline flex items-center gap-1 font-medium"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Generate Draft</span>
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={factsInput}
                  onChange={e => setFactsInput(e.target.value)}
                  placeholder="e.g. Polycab armored cables arriving in Chakan MIDC warehouse..."
                  className="w-full text-xs p-2.5 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1A73E8]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#202124] mb-1">Post Text (Google Maps Preview)</label>
                <textarea
                  rows={4}
                  value={summary}
                  onChange={e => setSummary(e.target.value)}
                  placeholder="Review or write final post text..."
                  className="w-full text-xs p-2.5 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1A73E8]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#202124] mb-1">Call to Action Button</label>
                <select
                  value={ctaType}
                  onChange={e => setCtaType(e.target.value)}
                  className="w-full p-2 bg-white border border-[#E5E7EB] rounded-lg"
                >
                  <option value="CALL">Call Now (+91 98220 14820)</option>
                  <option value="LEARN_MORE">Learn More (Website)</option>
                  <option value="SIGN_UP">Sign Up</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3.5 py-1.5 border border-[#E5E7EB] rounded-lg text-[#5F6368]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handlePublish}
                  className="px-4 py-1.5 bg-[#1A73E8] hover:bg-[#1557B0] text-white rounded-lg font-medium"
                >
                  Publish to Google
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export const MediaPage: React.FC = () => {
  const { business: uiBiz } = useUi();

  const photos = [
    { title: 'Storefront & Main Entrance', category: 'Exterior', views: '4,820', date: '15 Sep 2026' },
    { title: 'Industrial Switchgear Display Section', category: 'Interior', views: '3,240', date: '10 Sep 2026' },
    { title: 'Polycab Heavy Duty Armored Cables Warehouse', category: 'Product', views: '2,910', date: '08 Sep 2026' },
    { title: 'Custom Control Panel Fabrication Workshop', category: 'Workplace', views: '1,840', date: '01 Sep 2026' },
    { title: 'Certified Engineers Site Inspection', category: 'Team', views: '2,150', date: '25 Aug 2026' },
    { title: 'Atharv Electricals Official Brand Identity', category: 'Logo & Cover', views: '6,400', date: '12 Aug 2026' }
  ];

  return (
    <DashboardLayout>
      {/* Media Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-[#E5E7EB] mb-6 gap-4">
        <div>
          <h1 className="text-2xl sm:text-[28px] font-semibold text-[#202124] tracking-tight">
            Photos & Media
          </h1>
          <p className="text-xs sm:text-sm text-[#5F6368] mt-0.5">
            Manage store photos, exterior imagery and product showcases on Google Maps.
          </p>
          <p className="text-xs text-[#5F6368] mt-1 font-medium">
            Atharv Electricals · Chakan
          </p>
        </div>

        <button
          onClick={() => alert('Photo upload dialog - drag and drop high-res store images with GPS metadata.')}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1A73E8] hover:bg-[#1557B0] text-white text-xs font-medium rounded-lg transition-colors self-start sm:self-auto"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Upload Photos</span>
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {photos.map((p, idx) => (
          <div key={idx} className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden hover:border-[#1A73E8]/30 transition-colors">
            {/* Visual Header Placeholder */}
            <div className="h-40 bg-[#F8FAFC] border-b border-[#E5E7EB] flex flex-col items-center justify-center p-4 text-center">
              <div className="w-10 h-10 rounded-lg bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center mb-2">
                <ImageIcon className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-[#202124] line-clamp-1">{p.title}</span>
              <span className="text-[11px] text-[#5F6368]">{p.category}</span>
            </div>

            <div className="p-4 text-xs flex items-center justify-between">
              <span className="text-[#5F6368]">{p.date}</span>
              <span className="font-medium text-[#1A73E8] font-mono tabular-nums">{p.views} views</span>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
};
