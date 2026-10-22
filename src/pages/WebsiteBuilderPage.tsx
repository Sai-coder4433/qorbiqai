import React, { useState, useEffect } from 'react';
import {
  Globe,
  Layout,
  Palette,
  Eye,
  Send,
  Save,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Plus,
  Trash2,
  Sparkles,
  RefreshCw,
  Phone,
  MapPin,
  Clock,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { useUi } from '../lib/ui-context.tsx';
import { fetchApi } from '../lib/api.ts';

export interface WebsiteData {
  id?: string;
  businessId: string;
  organizationId?: string;
  slug: string;
  customDomain?: string;
  theme: 'restaurant' | 'cafe' | 'jewellery' | 'retail' | 'salon' | 'service' | 'real_estate' | 'professional';
  title: string;
  tagline: string;
  description: string;
  logoUrl?: string;
  coverUrl?: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  openingHours: string;
  googleMapsUrl?: string;
  primaryCtaText: string;
  primaryCtaLink: string;
  services: Array<{ title: string; description: string; price?: string }>;
  gallery: string[];
  seoTitle: string;
  seoDescription: string;
  status: 'DRAFT' | 'PUBLISHED' | 'UNPUBLISHED';
  publishedVersion: number;
}

export const WebsiteBuilderPage: React.FC = () => {
  const { business } = useUi();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'theme' | 'seo' | 'domain' | 'preview'>('content');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [site, setSite] = useState<WebsiteData>({
    businessId: business.id || 'biz_001',
    slug: business.slug || 'my-business',
    theme: 'service',
    title: business.name || 'Local Business',
    tagline: 'Reliable & Professional Local Services',
    description: 'Providing top-quality services and exceptional customer care right in your neighbourhood.',
    phone: business.phone || '+91 98220 14820',
    whatsapp: '+919822014820',
    email: 'contact@localbusiness.in',
    address: business.address || 'Main Road, Pune, Maharashtra 411001',
    openingHours: 'Mon - Sat: 9:00 AM - 8:00 PM | Sun: Closed',
    googleMapsUrl: '',
    primaryCtaText: 'Inquire on WhatsApp',
    primaryCtaLink: 'https://wa.me/919822014820',
    services: [
      { title: 'Standard Service Consultation', description: 'Comprehensive site assessment and quotation.', price: 'Free' },
      { title: 'On-Demand Maintenance', description: 'Prompt and certified troubleshooting services.', price: '₹499+' }
    ],
    gallery: [
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=600&q=80'
    ],
    seoTitle: `${business.name} | Official Website`,
    seoDescription: `Official website for ${business.name}. Contact us for inquiries, services, and location details.`,
    status: 'DRAFT',
    publishedVersion: 1
  });

  const [domainInput, setDomainInput] = useState('');
  const [domainStatus, setDomainStatus] = useState<'NONE' | 'PENDING' | 'ACTIVE'>('NONE');

  useEffect(() => {
    loadWebsite();
  }, [business.id]);

  const loadWebsite = async () => {
    setLoading(true);
    try {
      const res = await fetchApi<{ website: WebsiteData }>(`/websites/business/${business.id}`);
      if (res?.website) {
        setSite(res.website);
        if (res.website.customDomain) {
          setDomainInput(res.website.customDomain);
          setDomainStatus('ACTIVE');
        }
      }
    } catch (e) {
      // Use initial state if no website exists yet
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await fetchApi(`/websites/business/${business.id}`, {
        method: 'POST',
        body: JSON.stringify(site)
      });
      setMessage({ type: 'success', text: 'Website draft saved successfully!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save draft' });
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    setMessage(null);
    try {
      const res = await fetchApi<{ website: WebsiteData }>(`/websites/business/${business.id}/publish`, {
        method: 'POST',
        body: JSON.stringify(site)
      });
      setSite(res.website);
      setMessage({ type: 'success', text: `Website published live at /${site.slug} (v${res.website.publishedVersion})!` });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to publish website' });
    } finally {
      setPublishing(false);
    }
  };

  const addService = () => {
    setSite({
      ...site,
      services: [...site.services, { title: 'New Service', description: 'Service description...', price: '₹0' }]
    });
  };

  const removeService = (index: number) => {
    setSite({
      ...site,
      services: site.services.filter((_, i) => i !== index)
    });
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
        <p className="text-sm">Loading Website Configuration...</p>
      </div>
    );
  }

  const liveUrl = `${window.location.origin}/${site.slug}`;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-slate-900">Website Builder</h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                site.status === 'PUBLISHED'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              {site.status === 'PUBLISHED' ? `Live (v${site.publishedVersion})` : 'Draft Mode'}
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Create and publish a multi-tenant, mobile-first website for {business.name}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {site.status === 'PUBLISHED' && (
            <a
              href={`/${site.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              <ExternalLink className="w-4 h-4 text-slate-500" />
              View Live Website
            </a>
          )}
          <button
            onClick={handleSaveDraft}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
          >
            <Save className="w-4 h-4 text-slate-500" />
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            onClick={handlePublish}
            disabled={publishing}
            className="inline-flex items-center gap-1.5 px-5 py-2 bg-blue-600 rounded-lg text-sm font-medium text-white hover:bg-blue-700 transition disabled:opacity-50 shadow-xs"
          >
            <Send className="w-4 h-4" />
            {publishing ? 'Publishing...' : 'Publish Live'}
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        {[
          { id: 'content', label: 'Content & Info', icon: Layout },
          { id: 'theme', label: 'Theme & Style', icon: Palette },
          { id: 'seo', label: 'SEO & Meta', icon: Sparkles },
          { id: 'domain', label: 'Domains & Slug', icon: Globe },
          { id: 'preview', label: 'Live Preview', icon: Eye }
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 pb-3 font-medium text-sm border-b-2 transition ${
                active
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab: Content */}
      {activeTab === 'content' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-slate-900">General Information</h2>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Website Headline
              </label>
              <input
                type="text"
                value={site.title}
                onChange={(e) => setSite({ ...site, title: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Tagline</label>
              <input
                type="text"
                value={site.tagline}
                onChange={(e) => setSite({ ...site, tagline: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">About Description</label>
              <textarea
                rows={3}
                value={site.description}
                onChange={(e) => setSite({ ...site, description: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Phone Number</label>
                <input
                  type="text"
                  value={site.phone}
                  onChange={(e) => setSite({ ...site, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">WhatsApp Number</label>
                <input
                  type="text"
                  value={site.whatsapp}
                  onChange={(e) => setSite({ ...site, whatsapp: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Physical Address</label>
              <input
                type="text"
                value={site.address}
                onChange={(e) => setSite({ ...site, address: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Operating Hours</label>
              <input
                type="text"
                value={site.openingHours}
                onChange={(e) => setSite({ ...site, openingHours: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Services & Offerings */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">Services & Offerings</h2>
              <button
                onClick={addService}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                <Plus className="w-4 h-4" /> Add Item
              </button>
            </div>

            <div className="space-y-3">
              {site.services.map((svc, i) => (
                <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      placeholder="Service Title"
                      value={svc.title}
                      onChange={(e) => {
                        const updated = [...site.services];
                        updated[i].title = e.target.value;
                        setSite({ ...site, services: updated });
                      }}
                      className="font-semibold text-sm bg-white px-2 py-1 border border-slate-300 rounded flex-1"
                    />
                    <input
                      type="text"
                      placeholder="Price"
                      value={svc.price || ''}
                      onChange={(e) => {
                        const updated = [...site.services];
                        updated[i].price = e.target.value;
                        setSite({ ...site, services: updated });
                      }}
                      className="text-xs bg-white px-2 py-1 border border-slate-300 rounded w-24 text-right"
                    />
                    <button
                      onClick={() => removeService(i)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    placeholder="Short description..."
                    value={svc.description}
                    onChange={(e) => {
                      const updated = [...site.services];
                      updated[i].description = e.target.value;
                      setSite({ ...site, services: updated });
                    }}
                    className="text-xs bg-white w-full px-2 py-1 border border-slate-300 rounded"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Theme */}
      {activeTab === 'theme' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
          <h2 className="text-base font-semibold text-slate-900">Select Business Template</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { id: 'service', name: 'Service Business', desc: 'Contractors, cleaners, repairs' },
              { id: 'restaurant', name: 'Restaurant / Dining', desc: 'Menus, reservations, dining' },
              { id: 'cafe', name: 'Cafe & Bakery', desc: 'Specialties, seating, vibe' },
              { id: 'jewellery', name: 'Jewellery & Luxury', desc: 'Craftsmanship, collections' },
              { id: 'retail', name: 'Retail Store', desc: 'Products, offers, timings' },
              { id: 'salon', name: 'Salon & Spa', desc: 'Treatments, stylist info' },
              { id: 'real_estate', name: 'Real Estate Agency', desc: 'Properties, consults' },
              { id: 'professional', name: 'Professional Firm', desc: 'Law, accounting, advisors' }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setSite({ ...site, theme: t.id as any })}
                className={`p-4 rounded-xl border text-left transition flex flex-col justify-between ${
                  site.theme === t.id
                    ? 'border-blue-600 bg-blue-50/40 ring-2 ring-blue-600/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm mb-1">{t.name}</h3>
                  <p className="text-xs text-slate-500">{t.desc}</p>
                </div>
                {site.theme === t.id && (
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-blue-600">
                    <CheckCircle className="w-3.5 h-3.5" /> Selected
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tab: SEO */}
      {activeTab === 'seo' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 max-w-2xl">
          <h2 className="text-base font-semibold text-slate-900">Search Engine Optimization (SEO)</h2>
          <p className="text-xs text-slate-500">
            These meta tags appear on Google search results and when sharing your link on social platforms.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">SEO Title</label>
            <input
              type="text"
              value={site.seoTitle}
              onChange={(e) => setSite({ ...site, seoTitle: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Meta Description</label>
            <textarea
              rows={3}
              value={site.seoDescription}
              onChange={(e) => setSite({ ...site, seoDescription: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
            />
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase">Google Search Preview</span>
            <div className="text-blue-700 font-medium text-base hover:underline cursor-pointer">
              {site.seoTitle}
            </div>
            <div className="text-xs text-emerald-700">{liveUrl}</div>
            <div className="text-xs text-slate-600">{site.seoDescription}</div>
          </div>
        </div>
      )}

      {/* Tab: Domains */}
      {activeTab === 'domain' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6 max-w-3xl">
          <div>
            <h2 className="text-base font-semibold text-slate-900 mb-1">Multi-Tenant Sub-path URL</h2>
            <p className="text-xs text-slate-500 mb-3">
              Every business gets an instantaneous, SSL-secured sub-path website automatically.
            </p>
            <div className="flex items-center gap-2">
              <span className="px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-slate-500 text-sm font-mono">
                localos.ai/
              </span>
              <input
                type="text"
                value={site.slug}
                onChange={(e) =>
                  setSite({
                    ...site,
                    slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-')
                  })
                }
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono flex-1 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
              />
            </div>
          </div>

          <hr className="border-slate-200" />

          <div>
            <h2 className="text-base font-semibold text-slate-900 mb-1">Custom Domain Connection</h2>
            <p className="text-xs text-slate-500 mb-3">
              Connect your own custom domain (e.g. <code>spiralkatta.com</code>) using Cloudflare edge routing.
            </p>

            <div className="flex items-center gap-3 mb-4">
              <input
                type="text"
                placeholder="example.com or www.example.com"
                value={domainInput}
                onChange={(e) => setDomainInput(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm flex-1 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
              />
              <button
                onClick={() => {
                  if (domainInput) {
                    setDomainStatus('PENDING');
                    setSite({ ...site, customDomain: domainInput });
                    setMessage({ type: 'success', text: `Domain ${domainInput} registered. Add CNAME records below.` });
                  }
                }}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-black transition"
              >
                Connect Domain
              </button>
            </div>

            {domainStatus !== 'NONE' && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase">Required DNS Records</span>
                  <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Awaiting DNS Propagation
                  </span>
                </div>
                <div className="text-xs font-mono bg-white p-3 border border-slate-200 rounded space-y-1">
                  <div>Type: <strong>CNAME</strong></div>
                  <div>Name: <strong>@</strong> or <strong>www</strong></div>
                  <div>Target: <strong>domains.localos.ai</strong></div>
                  <div>TTL: <strong>Auto</strong></div>
                </div>
                <p className="text-xs text-slate-500">
                  Once your DNS record is configured, Cloudflare will automatically provision SSL certificates.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Preview */}
      {activeTab === 'preview' && (
        <div className="bg-slate-100 border border-slate-200 rounded-2xl p-6">
          <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
            {/* Mock browser bar */}
            <div className="bg-slate-100 border-b border-slate-200 px-4 py-2 flex items-center gap-2 text-xs font-mono text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <span className="ml-2 bg-white px-3 py-0.5 rounded border border-slate-200 flex-1 truncate">
                https://localos.ai/{site.slug}
              </span>
            </div>

            {/* Preview Header */}
            <div className="p-8 text-center bg-gradient-to-b from-blue-50/50 to-white border-b border-slate-100">
              <h1 className="text-3xl font-extrabold text-slate-900 mb-2">{site.title}</h1>
              <p className="text-base text-slate-600 max-w-xl mx-auto mb-6">{site.tagline}</p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <a
                  href={`https://wa.me/${site.whatsapp.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-5 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition"
                >
                  {site.primaryCtaText}
                </a>
                <a
                  href={`tel:${site.phone}`}
                  className="px-5 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-black transition"
                >
                  Call Now
                </a>
              </div>
            </div>

            {/* Preview Services */}
            <div className="p-8 space-y-6">
              <h2 className="text-xl font-bold text-slate-900 text-center">Our Services & Products</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {site.services.map((svc, i) => (
                  <div key={i} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-slate-900">{svc.title}</h3>
                      {svc.price && <span className="text-xs font-bold text-blue-600">{svc.price}</span>}
                    </div>
                    <p className="text-xs text-slate-600">{svc.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview Contact Footer */}
            <div className="bg-slate-900 text-white p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                <div>
                  <h4 className="font-bold text-white mb-2">Location</h4>
                  <p className="text-slate-400 text-xs">{site.address}</p>
                </div>
                <div>
                  <h4 className="font-bold text-white mb-2">Hours</h4>
                  <p className="text-slate-400 text-xs">{site.openingHours}</p>
                </div>
                <div>
                  <h4 className="font-bold text-white mb-2">Contact</h4>
                  <p className="text-slate-400 text-xs">Phone: {site.phone}</p>
                  <p className="text-slate-400 text-xs">WhatsApp: {site.whatsapp}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
