import React, { useState, useEffect } from 'react';
import {
  Building2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  Save,
  RefreshCw,
  Globe,
  MapPin,
  Sparkles,
  Phone,
  Palette,
  Languages
} from 'lucide-react';
import { freshTestApi, BusinessData } from '../../lib/fresh-test-api.ts';
import { MAIN_CATEGORIES, findCategoryById, getCategoryLabel, getSubcategoryLabel } from '../../lib/business-taxonomy.ts';
import { LogoUploader } from '../../components/common/LogoUploader.tsx';
import { useBusiness } from '../../lib/business-context.tsx';

export const BusinessProfilePage: React.FC = () => {
  const { activeBusiness } = useBusiness();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState('photography_videography');
  const [subcategory, setSubcategory] = useState('wedding_photographer');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');

  // Google Review URL & Verification (Section 16, 17, 18)
  const [googleReviewUrl, setGoogleReviewUrl] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [verifiedAt, setVerifiedAt] = useState<string | null>(null);
  const [showGuidanceModal, setShowGuidanceModal] = useState(false);
  const [showConfirmVerifyModal, setShowConfirmVerifyModal] = useState(false);
  const [testingUrl, setTestingUrl] = useState(false);

  // Experience options
  const [customerHeading, setCustomerHeading] = useState('Share Your Experience');
  const [welcomeMessage, setWelcomeMessage] = useState('Tell us about your genuine visit to create an editable review draft.');
  const [brandAccentColor, setBrandAccentColor] = useState('#2563eb');
  const [supportedLanguages, setSupportedLanguages] = useState<string[]>(['English', 'Hindi', 'Marathi']);

  useEffect(() => {
    loadBusiness();
  }, []);

  const loadBusiness = async () => {
    try {
      setLoading(true);
      setError(null);
      const b = await freshTestApi.getBusiness();
      if (b) {
        setBusinessName(b.businessName || '');
        let loadedCat = b.mainCategory || b.category || 'photography_videography';
        if (loadedCat === 'photography') loadedCat = 'photography_videography';
        if (loadedCat === 'jewellery') loadedCat = 'jewellery_gold';
        if (loadedCat === 'restaurant_cafe') loadedCat = 'restaurant';
        setCategory(loadedCat);
        setSubcategory(b.subcategory || findCategoryById(loadedCat)?.subcategories[0]?.id || 'other');
        setDescription(b.description || '');
        setCity(b.city || '');
        setStateName(b.state || '');
        setLogoUrl(b.logoUrl || '');
        setPhone(b.phone || '');
        setWebsite(b.website || '');
        setGoogleReviewUrl(b.googleReviewUrl || '');
        setIsVerified(Boolean(b.googleReviewVerified));
        setVerifiedAt(b.googleReviewVerifiedAt || null);
        if (b.customerHeading) setCustomerHeading(b.customerHeading);
        if (b.welcomeMessage) setWelcomeMessage(b.welcomeMessage);
        if (b.brandAccentColor) setBrandAccentColor(b.brandAccentColor);
        if (b.supportedLanguages?.length) setSupportedLanguages(b.supportedLanguages);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load business details');
    } finally {
      setLoading(false);
    }
  };

  const handleTestLink = async () => {
    if (!googleReviewUrl.trim()) {
      alert('Please enter your direct Google review link first.');
      return;
    }

    try {
      setTestingUrl(true);
      // Validate with backend
      const res = await freshTestApi.testGoogleUrl(googleReviewUrl.trim(), false);
      if (res.valid) {
        // Open safely in new tab
        window.open(googleReviewUrl.trim(), '_blank', 'noopener,noreferrer');
        // Prompt for owner confirmation
        setShowConfirmVerifyModal(true);
      }
    } catch (err: any) {
      alert(err.message || 'Invalid Google review link format.');
    } finally {
      setTestingUrl(false);
    }
  };

  const handleConfirmVerified = async () => {
    try {
      const res = await freshTestApi.testGoogleUrl(googleReviewUrl.trim(), true);
      setIsVerified(true);
      setVerifiedAt(res.verifiedAt || new Date().toISOString());
      setShowConfirmVerifyModal(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Verification failed');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim()) {
      setError('Business name is required.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await freshTestApi.saveBusiness({
        businessName: businessName.trim(),
        category,
        mainCategory: category,
        subcategory,
        description: description.trim(),
        city: city.trim(),
        state: stateName.trim(),
        logoUrl: logoUrl.trim(),
        phone: phone.trim(),
        website: website.trim(),
        googleReviewUrl: googleReviewUrl.trim(),
        googleReviewVerified: isVerified,
        googleReviewVerifiedAt: verifiedAt || undefined,
        customerHeading,
        welcomeMessage,
        brandAccentColor,
        supportedLanguages
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err: any) {
      setError(err.message || 'Failed to save business settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
        <p className="text-sm text-slate-500">Loading business profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="w-7 h-7 text-blue-600" />
            <span>Business Profile & Google Review Setup</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Configure your trade identity and direct Google Review destination link.
          </p>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Business settings and Google review destination updated successfully!</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        {/* SECTION 16: DIRECT GOOGLE REVIEW LINK */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-blue-500/40 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                Crucial Review Destination
              </span>
              <h2 className="text-lg font-bold text-slate-900 mt-1">Direct Google Review Link</h2>
            </div>
            <button
              type="button"
              onClick={() => setShowGuidanceModal(true)}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <HelpCircle className="w-4 h-4" />
              <span>Where do I find my Google Review Link?</span>
            </button>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-slate-600 leading-relaxed">
              Paste the direct link that opens the Google review screen for your business. Do NOT paste your Google Business Profile dashboard URL, generic Google Maps homepage, or Google search results.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch gap-2.5 pt-1">
              <input
                type="url"
                required
                value={googleReviewUrl}
                onChange={e => {
                  setGoogleReviewUrl(e.target.value);
                  setIsVerified(false);
                }}
                placeholder="https://g.page/r/your-business/review or https://search.google.com/local/writereview?placeid=..."
                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-mono text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
              />
              <button
                type="button"
                onClick={handleTestLink}
                disabled={testingUrl || !googleReviewUrl.trim()}
                className="px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Test Review Link</span>
              </button>
            </div>

            {/* Validation & Verification Status Badge (Section 18) */}
            <div className="pt-2 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                {isVerified ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Verified by owner {verifiedAt ? `on ${new Date(verifiedAt).toLocaleDateString()}` : ''}</span>
                  </span>
                ) : googleReviewUrl ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-semibold text-xs">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Unverified — Click "Test Review Link" to confirm</span>
                  </span>
                ) : (
                  <span className="text-slate-400 text-xs">No Google Review destination configured yet.</span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Business Trade Profile */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <h2 className="text-base font-bold text-slate-900">Trade & Location Details</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-slate-700 font-semibold">Business Name *</label>
              <input
                type="text"
                required
                value={businessName}
                onChange={e => setBusinessName(e.target.value)}
                placeholder="e.g. Royal Diamonds & Gold"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:bg-white focus:border-blue-500 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-700 font-semibold">Business Category *</label>
              <select
                value={category}
                onChange={e => {
                  const newCat = e.target.value;
                  setCategory(newCat);
                  const catObj = findCategoryById(newCat);
                  if (catObj && catObj.subcategories.length > 0) {
                    setSubcategory(catObj.subcategories[0].id);
                  } else {
                    setSubcategory('other');
                  }
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:bg-white focus:border-blue-500 outline-none cursor-pointer"
              >
                {MAIN_CATEGORIES.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-700 font-semibold">Subcategory *</label>
              <select
                value={subcategory}
                onChange={e => setSubcategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:bg-white focus:border-blue-500 outline-none cursor-pointer"
              >
                {(findCategoryById(category)?.subcategories || [{ id: 'other', label: 'Other' }]).map(sub => (
                  <option key={sub.id} value={sub.id}>
                    {sub.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-700 font-semibold">City</label>
              <input
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="e.g. Pune, Mumbai"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:bg-white focus:border-blue-500 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-700 font-semibold">State</label>
              <input
                type="text"
                value={stateName}
                onChange={e => setStateName(e.target.value)}
                placeholder="e.g. Maharashtra"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:bg-white focus:border-blue-500 outline-none"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-slate-700 font-semibold">Short Business Description</label>
              <textarea
                rows={2}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe your specialty, services, or product range..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:bg-white focus:border-blue-500 outline-none resize-none"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <LogoUploader
                value={logoUrl}
                onChange={url => setLogoUrl(url)}
                businessId={activeBusiness?.id || 'business'}
                label="Storefront Logo / Brand Image"
                description="Upload your store or business logo from your gallery. It will appear on your review QR stands and customer review flow."
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-700 font-semibold">Store Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:bg-white focus:border-blue-500 outline-none"
              />
            </div>
          </div>
        </section>

        {/* Customer Experience Configuration */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900">Customer Review Screen Customization</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-slate-700 font-semibold">Greeting Headline</label>
              <input
                type="text"
                value={customerHeading}
                onChange={e => setCustomerHeading(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:bg-white focus:border-blue-500 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-700 font-semibold">Brand Accent Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={brandAccentColor}
                  onChange={e => setBrandAccentColor(e.target.value)}
                  className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  value={brandAccentColor}
                  onChange={e => setBrandAccentColor(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Save Bar */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save All Settings'}</span>
          </button>
        </div>
      </form>

      {/* SECTION 17: GOOGLE REVIEW LINK GUIDANCE MODAL */}
      {showGuidanceModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-lg sm:text-xl">
                How to get your Google Review Link
              </h3>
              <button
                type="button"
                onClick={() => setShowGuidanceModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-slate-700">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-xs">1</span>
                  <p>Open your business's <strong>Google Business Profile</strong> (by searching your business name on Google while logged into your owner account).</p>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-xs">2</span>
                  <p>Look for the button labelled <strong>"Ask for reviews"</strong> or <strong>"Get more reviews"</strong>.</p>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-xs">3</span>
                  <p>Copy the direct review URL provided by Google (usually looks like <code>https://g.page/r/.../review</code>).</p>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-xs">4</span>
                  <p>Return to ReviewFlow AI and paste that direct link into the field.</p>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-xs">5</span>
                  <p>Click <strong>"Test Review Link"</strong> to confirm it opens the review dialog for your exact shop.</p>
                </div>
              </div>

              {/* Warning Callout (Section 17) */}
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1.5">
                <span className="font-bold block uppercase tracking-wider text-[10px] text-amber-800">
                  IMPORTANT: What NOT to paste
                </span>
                <ul className="list-disc list-inside space-y-0.5 text-amber-800/90 text-[11px]">
                  <li>Do NOT paste your GBP management dashboard URL.</li>
                  <li>Do NOT paste the Google Maps homepage.</li>
                  <li>Do NOT paste a Google search result page.</li>
                  <li>Do NOT paste another store's review link.</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowGuidanceModal(false)}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation of Test Link (Section 18) */}
      {showConfirmVerifyModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-bold text-slate-900 text-lg">Did the Google Review window open?</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Confirm whether the new window opened your business's direct review submission screen on Google.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowConfirmVerifyModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                No, Needs Adjustment
              </button>
              <button
                type="button"
                onClick={handleConfirmVerified}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Yes, Verified Destination
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
