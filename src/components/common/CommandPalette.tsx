import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Zap,
  Building2,
  MapPin,
  MessageSquare,
  KeyRound,
  FileText,
  Sparkles,
  ArrowRight,
  Shield,
  Code,
  X,
  RotateCw,
  Plus
} from 'lucide-react';
import { fetchApi } from '../../lib/api.ts';
import { useUi } from '../../lib/ui-context.tsx';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { business } = useUi();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>({
    businesses: [],
    locations: [],
    reviews: [],
    keywords: [],
    seoTasks: [],
    automations: [],
    reports: []
  });
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults({
        businesses: [],
        locations: [],
        reviews: [],
        keywords: [],
        seoTasks: [],
        automations: [],
        reports: []
      });
    }
  }, [isOpen]);

  // Live search
  useEffect(() => {
    if (!query.trim()) return;
    const timeout = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await fetchApi<{ results: any }>(`/search?q=${encodeURIComponent(query)}&businessId=${business?.id || 'biz_001'}`);
        setResults(res.results);
      } catch (e) {
        console.error('Search error:', e);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timeout);
  }, [query, business?.id]);

  if (!isOpen) return null;

  const handleAction = (path: string) => {
    onClose();
    navigate(path);
  };

  const quickActions = [
    { label: 'Run Google Sync', icon: RotateCw, path: '/app/dashboard', action: 'sync' },
    { label: 'Create Google Post', icon: Plus, path: '/app/posts' },
    { label: 'Run Local SEO Audit', icon: Search, path: '/app/seo' },
    { label: 'Open Approval Center', icon: Zap, path: '/app/automations?tab=approvals' },
    { label: 'Developer Dashboard & API Keys', icon: Code, path: '/developer' },
    { label: 'Admin Control Plane', icon: Shield, path: '/admin' }
  ];

  const hasResults =
    results.businesses.length > 0 ||
    results.locations.length > 0 ||
    results.reviews.length > 0 ||
    results.keywords.length > 0 ||
    results.seoTasks.length > 0 ||
    results.automations.length > 0 ||
    results.reports.length > 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-start justify-center pt-16 sm:pt-24 p-4 animate-in fade-in">
      <div
        className="bg-white rounded-2xl max-w-xl w-full border border-[#E5E7EB] shadow-2xl overflow-hidden flex flex-col max-h-[75vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-[#E5E7EB] gap-3">
          <Search className="w-5 h-5 text-[#5F6368] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Type a command or search reviews, keywords, locations..."
            className="flex-1 text-sm text-[#202124] placeholder-[#80868B] bg-transparent focus:outline-none"
          />
          {loading && <RotateCw className="w-4 h-4 text-[#1A73E8] animate-spin shrink-0" />}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-medium text-[#5F6368] bg-[#F1F3F4] rounded border border-[#DADCE0]">
            ESC
          </kbd>
          <button onClick={onClose} className="sm:hidden p-1 text-[#5F6368]">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Section */}
        <div className="overflow-y-auto p-2 space-y-4 text-xs divide-y divide-[#F1F3F4]">
          {/* Quick Actions (when no search query or matching) */}
          {!query && (
            <div className="p-2 space-y-1">
              <span className="text-[10px] font-bold text-[#80868B] uppercase tracking-wider block px-2 mb-1">
                Quick Actions
              </span>
              {quickActions.map((act, idx) => {
                const Icon = act.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => handleAction(act.path)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[#F8FAFC] text-[#202124] text-left transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-md bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-medium">{act.label}</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[#9AA0A6] group-hover:text-[#1A73E8] transition-colors" />
                  </button>
                );
              })}
            </div>
          )}

          {/* Search Results */}
          {query && hasResults && (
            <div className="space-y-3 pt-2">
              {/* Businesses */}
              {results.businesses.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold text-[#80868B] uppercase tracking-wider block px-2 mb-1">
                    Businesses
                  </span>
                  {results.businesses.map((b: any) => (
                    <button
                      key={b.id}
                      onClick={() => handleAction('/app/business')}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-[#F8FAFC] text-left"
                    >
                      <Building2 className="w-4 h-4 text-[#1A73E8]" />
                      <div>
                        <span className="font-medium text-[#202124] block">{b.name}</span>
                        <span className="text-[10px] text-[#5F6368]">{b.city}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Reviews */}
              {results.reviews.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold text-[#80868B] uppercase tracking-wider block px-2 mb-1">
                    Customer Reviews
                  </span>
                  {results.reviews.map((r: any) => (
                    <button
                      key={r.id}
                      onClick={() => handleAction('/app/reviews')}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-[#F8FAFC] text-left"
                    >
                      <MessageSquare className="w-4 h-4 text-[#188038]" />
                      <div className="truncate">
                        <span className="font-medium text-[#202124] block truncate">
                          {r.reviewerName} ({r.starRating}★)
                        </span>
                        <span className="text-[10px] text-[#5F6368] truncate block">{r.comment || 'Review on Google'}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Keywords */}
              {results.keywords.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold text-[#80868B] uppercase tracking-wider block px-2 mb-1">
                    Keywords
                  </span>
                  {results.keywords.map((k: any) => (
                    <button
                      key={k.id}
                      onClick={() => handleAction('/app/keywords')}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-[#F8FAFC] text-left"
                    >
                      <KeyRound className="w-4 h-4 text-[#F9AB00]" />
                      <span className="font-medium text-[#202124]">{k.keyword}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Automations */}
              {results.automations.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold text-[#80868B] uppercase tracking-wider block px-2 mb-1">
                    Automations
                  </span>
                  {results.automations.map((a: any) => (
                    <button
                      key={a.id}
                      onClick={() => handleAction('/app/automations')}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-[#F8FAFC] text-left"
                    >
                      <Zap className="w-4 h-4 text-[#1A73E8]" />
                      <span className="font-medium text-[#202124]">{a.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {query && !hasResults && !loading && (
            <div className="p-8 text-center text-[#5F6368]">
              No results found for "{query}". Try searching for reviews, keywords, or locations.
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-2.5 px-4 bg-[#F8FAFC] border-t border-[#E5E7EB] flex items-center justify-between text-[11px] text-[#80868B]">
          <span>Navigation shortcut</span>
          <div className="flex items-center gap-2">
            <span>Use</span>
            <kbd className="px-1.5 py-0.5 bg-white border border-[#DADCE0] rounded text-[10px]">↑</kbd>
            <kbd className="px-1.5 py-0.5 bg-white border border-[#DADCE0] rounded text-[10px]">↓</kbd>
            <span>to select</span>
          </div>
        </div>
      </div>
    </div>
  );
};
