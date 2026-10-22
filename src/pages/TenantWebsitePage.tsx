import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Phone,
  MessageCircle,
  MapPin,
  Clock,
  Star,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Mail,
  AlertTriangle
} from 'lucide-react';
import { fetchApi } from '../lib/api.ts';
import { WebsiteData } from './WebsiteBuilderPage.tsx';

export const TenantWebsitePage: React.FC = () => {
  const { businessSlug } = useParams<{ businessSlug: string }>();
  const [site, setSite] = useState<WebsiteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!businessSlug) return;
    loadTenantSite(businessSlug);
  }, [businessSlug]);

  const loadTenantSite = async (slug: string) => {
    setLoading(true);
    setNotFound(false);
    try {
      const res = await fetchApi<{ website: WebsiteData }>(`/websites/public/${slug}`);
      if (res?.website) {
        setSite(res.website);
        // Dynamically update document title for SEO
        document.title = res.website.seoTitle || res.website.title;
      } else {
        setNotFound(true);
      }
    } catch (e) {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Loading Business Website...
          </p>
        </div>
      </div>
    );
  }

  if (notFound || !site) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-xs">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Website Not Found</h1>
          <p className="text-sm text-slate-500 mb-6">
            The requested business page <strong>{businessSlug}</strong> does not exist or has not been published yet.
          </p>
          <Link
            to="/"
            className="inline-flex items-center justify-center px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
          >
            Go to LOCALOS AI Home
          </Link>
        </div>
      </div>
    );
  }

  const cleanPhone = site.phone?.replace(/[^0-9+]/g, '') || '';
  const cleanWhatsApp = site.whatsapp?.replace(/[^0-9]/g, '') || '';

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Top Notice / Announcement */}
      <div className="bg-slate-900 text-slate-300 text-xs py-2 px-4 text-center">
        <span>Verified Local Business on LOCALOS AI Network • </span>
        <Link to={`/r/${site.slug}`} className="text-blue-400 hover:underline font-semibold ml-1">
          Leave a Review on Google →
        </Link>
      </div>

      {/* Main Header / Navigation */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              {site.title.charAt(0)}
            </div>
            <div>
              <span className="font-bold text-slate-900 text-base leading-tight block">{site.title}</span>
              <span className="text-xs text-slate-500 capitalize">{site.theme} Business</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {cleanPhone && (
              <a
                href={`tel:${cleanPhone}`}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
              >
                <Phone className="w-3.5 h-3.5 text-slate-500" />
                Call {site.phone}
              </a>
            )}
            {cleanWhatsApp && (
              <a
                href={`https://wa.me/${cleanWhatsApp}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition shadow-xs"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp Us
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-16 md:py-24 bg-gradient-to-b from-blue-50/40 via-white to-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-200 text-blue-700 rounded-full text-xs font-semibold mb-6">
            <ShieldCheck className="w-3.5 h-3.5" /> Verified Local Presence
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
            {site.title}
          </h1>
          <p className="text-lg md:text-xl text-slate-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            {site.tagline}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            {cleanWhatsApp && (
              <a
                href={`https://wa.me/${cleanWhatsApp}`}
                target="_blank"
                rel="noreferrer"
                className="px-6 py-3.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition shadow-sm inline-flex items-center gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                {site.primaryCtaText || 'Inquire on WhatsApp'}
              </a>
            )}
            <Link
              to={`/r/${site.slug}`}
              className="px-6 py-3.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-black transition shadow-sm inline-flex items-center gap-2"
            >
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              Write a Review
            </Link>
          </div>
        </div>
      </section>

      {/* About & Quick Details */}
      <section className="py-12 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl border border-slate-100 bg-slate-50/60 flex items-start gap-4">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm mb-1">Our Location</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{site.address}</p>
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-slate-100 bg-slate-50/60 flex items-start gap-4">
              <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm mb-1">Opening Hours</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{site.openingHours}</p>
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-slate-100 bg-slate-50/60 flex items-start gap-4">
              <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm mb-1">Contact Details</h3>
                <p className="text-xs text-slate-600">Phone: {site.phone}</p>
                <p className="text-xs text-slate-600">Email: {site.email}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      {site.services && site.services.length > 0 && (
        <section className="py-16 bg-slate-50 border-t border-b border-slate-200">
          <div className="max-w-5xl mx-auto px-4">
            <div className="text-center max-w-xl mx-auto mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">Our Offerings & Services</h2>
              <p className="text-sm text-slate-500">
                Explore our catalog of services provided with guaranteed quality and prompt customer support.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {site.services.map((svc, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs hover:border-blue-400 transition"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-slate-900 text-base">{svc.title}</h3>
                    {svc.price && (
                      <span className="px-2.5 py-1 bg-blue-50 text-blue-700 font-bold text-xs rounded-full">
                        {svc.price}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{svc.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Review Callout Banner */}
      <section className="py-12 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-2">Recently Visited {site.title}?</h2>
          <p className="text-blue-100 text-sm mb-6 max-w-lg mx-auto">
            Your honest feedback helps our local business grow and helps other customers find us on Google.
          </p>
          <Link
            to={`/r/${site.slug}`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-700 font-bold text-sm rounded-xl hover:bg-blue-50 transition shadow-sm"
          >
            Leave a Star Review →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-12 text-xs">
        <div className="max-w-5xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} {site.title}. All rights reserved.</p>
          <p className="flex items-center gap-1">
            <span>Powered by</span>
            <Link to="/" className="text-white font-semibold hover:underline">
              LOCALOS AI
            </Link>
            <span>• Multi-Tenant Local OS</span>
          </p>
        </div>
      </footer>
    </div>
  );
};
