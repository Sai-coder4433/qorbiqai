import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Building2,
  Sparkles,
  MapPin,
  Globe,
  Phone,
  Link as LinkIcon,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Check,
  Smartphone,
  ExternalLink,
  Plus,
  Trash2,
  QrCode,
  RefreshCw,
  Edit2,
  Radio,
  Clock,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { freshTestApi, BusinessData } from '../../lib/fresh-test-api.ts';
import { MAIN_CATEGORIES, findCategoryById } from '../../lib/business-taxonomy.ts';
import { useAuth } from '../../lib/auth-context.tsx';
import { useBusiness } from '../../lib/business-context.tsx';
import { syncBusinessToFirestore, syncQrCodeToFirestore } from '../../lib/firestore-sync.ts';
import { LogoUploader } from '../../components/common/LogoUploader.tsx';

interface TopicItem {
  id: string;
  topic: string;
  description: string;
}

export const OnboardingWizardPage: React.FC = () => {
  const { businessId: routeBusinessId } = useParams<{ businessId?: string }>();
  const [searchParams] = useSearchParams();
  const queryBusinessId = searchParams.get('businessId');
  const targetBusinessId = routeBusinessId || queryBusinessId || '';

  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeBusiness, refreshBusinesses, selectBusiness } = useBusiness();

  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Business Document ID being onboarded
  const [currentBusinessId, setCurrentBusinessId] = useState<string>(targetBusinessId);

  // STEP 1 Form State
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState('jewellery_gold');
  const [subcategory, setSubcategory] = useState('gold_jewellery');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('Maharashtra');
  const [country, setCountry] = useState('India');
  const [primaryLanguage, setPrimaryLanguage] = useState('English');
  const [phone, setPhone] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  // STEP 2 Form State: Google Review URL
  const [googleReviewUrl, setGoogleReviewUrl] = useState('');
  const [testedReviewLink, setTestedReviewLink] = useState(false);
  const [urlValidationError, setUrlValidationError] = useState<string | null>(null);

  // STEP 3 Form State: AI Experience Topics
  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [generatingTopics, setGeneratingTopics] = useState(false);
  const [topicsError, setTopicsError] = useState<string | null>(null);
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);

  // STEP 4 Form State: Dynamic QR & NFC
  const [businessCode, setBusinessCode] = useState('');
  const [primaryQr, setPrimaryQr] = useState<any>(null);

  // Meaningless keyword list to reject
  const meaninglessWords = ['test', 'abc', 'business', '123', 'hello', 'demo', 'xyz', 'none', 'na', 'n/a', 'shop', 'sample'];

  // Validation Checks for Step 1
  const isNameValid = businessName.trim().length >= 2 && !meaninglessWords.includes(businessName.trim().toLowerCase());
  const isCategoryValid = category.trim().length > 0;
  const isDescriptionValid =
    description.trim().length >= 15 &&
    !meaninglessWords.some(w => description.trim().toLowerCase() === w || description.trim().toLowerCase().startsWith(w + ' '));
  const isCityValid = city.trim().length >= 2 && !meaninglessWords.includes(city.trim().toLowerCase());
  const isStateValid = stateName.trim().length >= 2;
  const isLanguageValid = primaryLanguage.trim().length >= 2;

  const isStep1Valid = isNameValid && isCategoryValid && isDescriptionValid && isCityValid && isStateValid && isLanguageValid;

  // Validation for Step 2
  const validateGoogleUrl = (url: string): boolean => {
    const trimmed = url.trim();
    if (!trimmed) {
      setUrlValidationError('Google Review URL is required.');
      return false;
    }
    // Reject generic search / homepages
    const lowercase = trimmed.toLowerCase();
    if (
      lowercase === 'https://google.com' ||
      lowercase === 'https://www.google.com' ||
      lowercase === 'http://google.com' ||
      lowercase === 'https://maps.google.com' ||
      lowercase === 'https://www.google.com/maps' ||
      lowercase === 'https://business.google.com' ||
      lowercase.includes('google.com/search') ||
      lowercase.includes('google.co.in/search')
    ) {
      setUrlValidationError('Please enter your direct Google Review link, not a generic search or homepage.');
      return false;
    }
    if (!lowercase.startsWith('http://') && !lowercase.startsWith('https://')) {
      setUrlValidationError('URL must start with https:// or http://');
      return false;
    }
    setUrlValidationError(null);
    return true;
  };

  const isStep2Valid = googleReviewUrl.trim().length > 0 && !urlValidationError;

  // Initialize or load target business
  useEffect(() => {
    loadBusinessToOnboard();
  }, [targetBusinessId]);

  const loadBusinessToOnboard = async () => {
    try {
      setLoading(true);
      setError(null);

      let bizIdToUse = targetBusinessId;

      if (!bizIdToUse) {
        // Query user's businesses
        const bizListRes = await freshTestApi.getBusinesses().catch(() => ({ businesses: [], activeBusinessId: '' }));
        const list = bizListRes.businesses || [];
        if (list.length === 0) {
          // No business at all -> user must purchase a subscription first
          navigate('/app/pricing', { replace: true });
          return;
        }

        // Find an incomplete business
        const incomplete = list.find(b => b.onboardingStatus !== 'COMPLETED' && !b.onboardingCompleted);
        if (incomplete) {
          bizIdToUse = incomplete.id;
        } else {
          // If all are completed, redirect to dashboard of active business
          const activeId = bizListRes.activeBusinessId || list[0].id;
          navigate(`/app/dashboard/${activeId}`, { replace: true });
          return;
        }
      }

      setCurrentBusinessId(bizIdToUse);

      // Fetch the business record from server
      const b = await freshTestApi.getBusiness(bizIdToUse);

      if (!b) {
        setError('Business workspace could not be found.');
        return;
      }

      // Check ownership
      if (user?.uid && b.ownerUid && b.ownerUid !== user.uid && (b as any).ownerId !== user.uid) {
        setError('Access denied: You do not have permission to configure this business.');
        return;
      }

      // If already completed, never display onboarding again
      if (b.onboardingStatus === 'COMPLETED' || b.onboardingCompleted) {
        navigate(`/app/dashboard/${b.id}`, { replace: true });
        return;
      }

      // Populate fresh business information
      setBusinessName(b.businessName || '');
      setCategory(b.category || 'jewellery_gold');
      setSubcategory(b.subcategory || findCategoryById(b.category || 'jewellery_gold')?.subcategories[0]?.id || 'gold_jewellery');
      setDescription(b.description || '');
      setCity(b.city || '');
      setStateName(b.state || 'Maharashtra');
      setCountry(b.country || 'India');
      setPrimaryLanguage(b.primaryLanguage || b.preferredLanguage || 'English');
      setPhone(b.phone || '');
      setBusinessEmail(b.email || '');
      setWebsite(b.website || '');
      setLogoUrl(b.logoUrl || '');

      if (b.googleReviewUrl) {
        setGoogleReviewUrl(b.googleReviewUrl);
        validateGoogleUrl(b.googleReviewUrl);
      }

      // If business already has code / QR
      if (b.uniqueCode) {
        setBusinessCode(b.uniqueCode);
      }

      // If topics exist in DB already, load them
      try {
        const topicsRes = await freshTestApi.getBusinessTopics(bizIdToUse);
        if (topicsRes.topics && topicsRes.topics.length >= 5) {
          setTopics(topicsRes.topics.map(t => ({ id: t.id, topic: t.title, description: t.description })));
        }
      } catch {
        // Topics not yet generated
      }

      // Restore step position based on onboarding status
      if (b.onboardingStatus === 'REVIEW_URL_PENDING' || (b.businessName && !b.googleReviewUrl)) {
        setStep(2);
      } else if (b.onboardingStatus === 'TOPICS_REVIEW' || b.aiTopicsGenerated) {
        setStep(3);
      } else if (b.onboardingStatus === 'QR_NFC_SETUP') {
        setStep(4);
      } else {
        setStep(1);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load business configuration.');
    } finally {
      setLoading(false);
    }
  };

  // STEP 1 -> STEP 2 Transition
  const handleProceedToStep2 = () => {
    if (!isStep1Valid) return;
    setError(null);
    setStep(2);
  };

  // Test Review Link Button Handler
  const handleTestReviewLink = () => {
    if (!googleReviewUrl.trim()) return;
    if (validateGoogleUrl(googleReviewUrl)) {
      window.open(googleReviewUrl.trim(), '_blank', 'noopener,noreferrer');
      setTestedReviewLink(true);
    }
  };

  // STEP 2 -> STEP 3: Save Business First to DB, then Call Gemini
  const handleSaveAndGenerateTopics = async () => {
    if (!validateGoogleUrl(googleReviewUrl)) return;

    setError(null);
    setSaving(true);
    setTopicsError(null);

    // Save business record first
    const payload = {
      id: currentBusinessId,
      businessName: businessName.trim(),
      category: category,
      subcategory: subcategory,
      description: description.trim(),
      city: city.trim(),
      state: stateName.trim(),
      country: country.trim(),
      primaryLanguage: primaryLanguage,
      googleReviewUrl: googleReviewUrl.trim(),
      phone: phone.trim(),
      email: businessEmail.trim(),
      website: website.trim(),
      logoUrl: logoUrl.trim(),
      onboardingStatus: 'TOPICS_REVIEW' as const
    };

    let savedBiz: BusinessData;
    try {
      savedBiz = await freshTestApi.saveBusiness(payload);
      if (!savedBiz || !savedBiz.id) {
        throw new Error('Save returned invalid payload');
      }

      // Sync to direct Firestore
      if (user?.uid) {
        syncBusinessToFirestore({
          id: savedBiz.id,
          ownerUid: user.uid,
          businessName: payload.businessName,
          category: payload.category,
          subcategory: payload.subcategory,
          description: payload.description,
          city: payload.city,
          state: payload.state,
          country: payload.country,
          primaryLanguage: payload.primaryLanguage,
          googleReviewUrl: payload.googleReviewUrl,
          logoUrl: payload.logoUrl,
          onboardingStatus: 'IN_PROGRESS',
          onboardingCompleted: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    } catch (saveErr: any) {
      // STOP. Do not run AI if Firestore save fails.
      setError('Your business information could not be saved. Please try again.');
      setSaving(false);
      return;
    }

    setSaving(false);
    setStep(3);

    // Now call Gemini securely through backend
    await triggerTopicGeneration(savedBiz.id, false);
  };

  const triggerTopicGeneration = async (bizId: string, forceFresh: boolean) => {
    try {
      setGeneratingTopics(true);
      setTopicsError(null);

      const res = await freshTestApi.generateBusinessTopics(bizId, forceFresh);
      if (res && res.topics && res.topics.length >= 5) {
        setTopics(res.topics.map(t => ({
          id: t.id,
          topic: t.title,
          description: t.description
        })));
      } else {
        throw new Error('AI could not generate enough topics. Please try regenerating.');
      }
    } catch (err: any) {
      setTopicsError('AI generation failed. Please click "Regenerate" to try again.');
    } finally {
      setGeneratingTopics(false);
    }
  };

  // Topic Editing
  const handleUpdateTopic = (id: string, newTitle: string, newDesc: string) => {
    setTopics(prev => prev.map(t => (t.id === id ? { ...t, topic: newTitle, description: newDesc } : t)));
  };

  const handleAddCustomTopic = () => {
    const newTopic: TopicItem = {
      id: `topic_custom_${Date.now()}`,
      topic: 'Customer Assistance',
      description: 'How helpful and attentive our team was during your visit'
    };
    setTopics(prev => [...prev, newTopic]);
  };

  const handleRemoveTopic = (id: string) => {
    if (topics.length <= 5) {
      setTopicsError('Please retain at least 5-8 experience topics for customer review selection.');
      return;
    }
    setTopics(prev => prev.filter(t => t.id !== id));
  };

  // STEP 3 -> STEP 4: Confirm Topics & Move to QR/NFC
  const handleConfirmTopics = async () => {
    if (topics.length < 5) {
      setTopicsError('Please ensure you have at least 5-8 topics before continuing.');
      return;
    }

    try {
      setSaving(true);
      setTopicsError(null);

      // Save confirmed topics to experience_topics collection
      await freshTestApi.saveBusinessTopics(currentBusinessId, topics.map((t, idx) => ({
        id: t.id,
        title: t.topic,
        description: t.description,
        sortOrder: idx + 1
      })));

      // Ensure QR Code and NFC exist for this business
      const qrs = await freshTestApi.getQrCodes();
      let currentQr = qrs.find(q => q.businessId === currentBusinessId);
      if (!currentQr) {
        currentQr = await freshTestApi.createQrCode('Primary Dynamic Stand');
      }

      setPrimaryQr(currentQr);
      if (currentQr?.uniqueCode) {
        setBusinessCode(currentQr.uniqueCode);
      }

      setStep(4);
    } catch (err: any) {
      setTopicsError(err.message || 'Failed to save experience topics.');
    } finally {
      setSaving(false);
    }
  };

  // STEP 4 -> STEP 5: Complete Onboarding & Activate Business
  const handleCompleteOnboarding = async () => {
    try {
      setSaving(true);
      setError(null);

      // Complete onboarding on server
      const res = await freshTestApi.completeBusinessOnboarding(currentBusinessId);

      if (!res.success) {
        throw new Error((res as any).error || 'Server validation checks failed.');
      }

      // Sync Firestore completed state
      if (user?.uid) {
        syncBusinessToFirestore({
          id: currentBusinessId,
          ownerUid: user.uid,
          businessName: businessName,
          category: category,
          subcategory: subcategory,
          description: description,
          city: city,
          state: stateName,
          country: country,
          primaryLanguage: primaryLanguage,
          googleReviewUrl: googleReviewUrl,
          onboardingStatus: 'COMPLETED',
          onboardingCompleted: true,
          onboardingCompletedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }

      await refreshBusinesses();
      await selectBusiness(currentBusinessId);

      setSuccess('🎉 Onboarding completed! Your business is now ACTIVE.');
      setTimeout(() => {
        navigate(`/app/dashboard/${currentBusinessId}`, { replace: true });
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Failed to complete onboarding. Please verify all setup steps.');
    } finally {
      setSaving(false);
    }
  };

  const stepsHeader = [
    { num: 1, label: 'Business Info' },
    { num: 2, label: 'Google Review Link' },
    { num: 3, label: 'AI Experience Topics' },
    { num: 4, label: 'Dynamic QR & NFC' },
    { num: 5, label: 'Complete' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium">Loading business setup wizard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 pt-4 px-4 font-sans">
      {/* Top Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Dedicated Business Onboarding</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {businessName ? `Configure ${businessName}` : 'Set Up Your Business'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete all 5 required setup steps to activate your review collection stand.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full">
            Status: Setup In Progress
          </span>
        </div>
      </div>

      {/* Steps Indicator */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {stepsHeader.map(s => {
            const isPassed = step > s.num;
            const isCurrent = step === s.num;
            return (
              <div
                key={s.num}
                className={`flex items-center gap-2.5 p-2 rounded-xl text-xs font-bold transition-colors ${
                  isCurrent
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : isPassed
                    ? 'text-emerald-700 bg-emerald-50/50'
                    : 'text-slate-400 bg-slate-50'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] shrink-0 font-bold ${
                    isPassed
                      ? 'bg-emerald-600 text-white'
                      : isCurrent
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {isPassed ? <Check className="w-3.5 h-3.5" /> : s.num}
                </div>
                <span className="truncate">{s.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Global Alerts */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl flex items-start gap-2.5 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 font-semibold">{error}</div>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-start gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1 font-semibold">{success}</div>
        </div>
      )}

      {/* STEP 1: BUSINESS INFORMATION */}
      {step === 1 && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-900">Step 1 — Business Information</h2>
            <p className="text-xs text-slate-500 mt-1">
              Provide authentic details about this specific location or business. Do not use test or generic placeholders.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Business Name */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700">
                Business Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={businessName}
                onChange={e => setBusinessName(e.target.value)}
                placeholder="e.g. Royal Heritage Jewellers"
                className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 ${
                  businessName && !isNameValid ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200 focus:ring-blue-100'
                }`}
              />
              {businessName && !isNameValid && (
                <span className="text-[11px] text-rose-600">Please enter a valid, authentic business name (not test/placeholder).</span>
              )}
            </div>

            {/* Shop Owner Logo Upload (from Gallery / Files) */}
            <div className="sm:col-span-2">
              <LogoUploader
                value={logoUrl}
                onChange={(url) => setLogoUrl(url)}
                businessId={currentBusinessId || 'new_biz'}
                label="Storefront Logo / Brand Image"
                description="Upload your store or business logo from your gallery. It will appear on your review QR stands and customer review flow."
              />
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={e => {
                  setCategory(e.target.value);
                  const found = findCategoryById(e.target.value);
                  if (found && found.subcategories.length > 0) {
                    setSubcategory(found.subcategories[0].id);
                  }
                }}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 cursor-pointer"
              >
                {MAIN_CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Subcategory */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Subcategory
              </label>
              <select
                value={subcategory}
                onChange={e => setSubcategory(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 cursor-pointer"
              >
                {findCategoryById(category)?.subcategories.map(sub => (
                  <option key={sub.id} value={sub.id}>
                    {sub.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Business Description */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700">
                Business Description <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Explain what products or services customers visit for, your specialty, and unique store qualities..."
                className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 ${
                  description && !isDescriptionValid ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200 focus:ring-blue-100'
                }`}
              />
              {description && !isDescriptionValid && (
                <span className="text-[11px] text-rose-600">
                  Please provide a meaningful description (at least 15 characters, no generic placeholders like 'test' or '123').
                </span>
              )}
            </div>

            {/* City */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                City <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="e.g. Pune"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white"
              />
            </div>

            {/* State */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                State <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={stateName}
                onChange={e => setStateName(e.target.value)}
                placeholder="e.g. Maharashtra"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white"
              />
            </div>

            {/* Primary Language */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Primary Customer Language <span className="text-rose-500">*</span>
              </label>
              <select
                value={primaryLanguage}
                onChange={e => setPrimaryLanguage(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white cursor-pointer"
              >
                <option value="English">English</option>
                <option value="Marathi">Marathi (मराठी)</option>
                <option value="Hindi">Hindi (हिंदी)</option>
                <option value="Gujarati">Gujarati (ગુજરાતી)</option>
              </select>
            </div>

            {/* Phone (Optional) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Business Contact Phone <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white"
              />
            </div>

            {/* Business Email (Optional) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Business Email <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="email"
                value={businessEmail}
                onChange={e => setBusinessEmail(e.target.value)}
                placeholder="store@example.com"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white"
              />
            </div>

            {/* Website (Optional) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Website URL <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="url"
                value={website}
                onChange={e => setWebsite(e.target.value)}
                placeholder="https://mybusiness.com"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <span className="text-[11px] text-slate-400">
              * Required fields must pass validation before advancing
            </span>
            <button
              type="button"
              onClick={handleProceedToStep2}
              disabled={!isStep1Valid}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>Continue to Google Review Setup</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: GOOGLE REVIEW SETUP */}
      {step === 2 && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-900">Step 2 — Google Review Setup</h2>
            <p className="text-xs text-slate-500 mt-1">
              Provide your direct Google Review write URL. Generic search links or homepage URLs are strictly rejected.
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-blue-50/60 border border-blue-100 rounded-2xl text-xs text-blue-900 space-y-1">
              <span className="font-bold flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-blue-600" />
                Where does customer feedback go?
              </span>
              <p className="text-blue-800 leading-relaxed text-[11px]">
                ReviewFlow AI assists customers in turning their authentic experience into a drafted review. When they tap 'Submit Review', they are taken directly to this Google destination URL.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Direct Google Review URL <span className="text-rose-500">*</span>
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="url"
                  value={googleReviewUrl}
                  onChange={e => {
                    setGoogleReviewUrl(e.target.value);
                    validateGoogleUrl(e.target.value);
                  }}
                  placeholder="https://g.page/r/your-id/review or https://search.google.com/local/writereview?placeid=..."
                  className={`flex-1 px-4 py-2.5 bg-slate-50 border rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 ${
                    urlValidationError ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200 focus:ring-blue-100'
                  }`}
                />
                <button
                  type="button"
                  onClick={handleTestReviewLink}
                  disabled={!googleReviewUrl.trim()}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Test Review Link</span>
                </button>
              </div>
              {urlValidationError && (
                <span className="text-[11px] text-rose-600 block">{urlValidationError}</span>
              )}
              {testedReviewLink && !urlValidationError && (
                <span className="text-[11px] text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Link opened in test tab. Verify that it directs to your business's Google review form.
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-2 text-slate-600 hover:text-slate-900 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              type="button"
              onClick={handleSaveAndGenerateTopics}
              disabled={saving || !isStep2Valid}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Saving & Analyzing with Gemini...</span>
                </>
              ) : (
                <>
                  <span>Save & Analyze with Gemini</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: AI EXPERIENCE TOPICS */}
      {step === 3 && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Step 3 — Customer Experience Topics</h2>
              <p className="text-xs text-slate-500 mt-1">
                Gemini analyzed your saved business record and generated 7–8 experience touchpoints for customer reviews.
              </p>
            </div>
            <button
              type="button"
              onClick={() => triggerTopicGeneration(currentBusinessId, true)}
              disabled={generatingTopics}
              className="px-3.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer self-start sm:self-auto disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${generatingTopics ? 'animate-spin' : ''}`} />
              <span>Regenerate Fresh Topics</span>
            </button>
          </div>

          {topicsError && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl flex items-center justify-between">
              <span>{topicsError}</span>
              <button
                onClick={() => triggerTopicGeneration(currentBusinessId, true)}
                className="underline font-bold ml-2 cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {generatingTopics ? (
            <div className="py-16 text-center space-y-3">
              <Sparkles className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-700">
                Gemini AI is analyzing {businessName} ({category.replace(/_/g, ' ')})...
              </p>
              <p className="text-[11px] text-slate-400">
                Generating 7–8 business-specific customer experience touchpoints without emojis or marketing fluff.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {topics.map((t, idx) => {
                  const isEditing = editingTopicId === t.id;
                  return (
                    <div
                      key={t.id}
                      className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-blue-300 transition-all space-y-2"
                    >
                      {isEditing ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={t.topic}
                            onChange={e => handleUpdateTopic(t.id, e.target.value, t.description)}
                            className="w-full px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
                          />
                          <textarea
                            rows={2}
                            value={t.description}
                            onChange={e => handleUpdateTopic(t.id, t.topic, e.target.value)}
                            className="w-full px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-[11px] text-slate-600"
                          />
                          <button
                            type="button"
                            onClick={() => setEditingTopicId(null)}
                            className="px-2.5 py-1 bg-blue-600 text-white text-[10px] font-bold rounded-lg cursor-pointer"
                          >
                            Done Editing
                          </button>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[10px] flex items-center justify-center font-bold">
                                {idx + 1}
                              </span>
                              {t.topic}
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => setEditingTopicId(t.id)}
                                className="p-1 text-slate-400 hover:text-blue-600 cursor-pointer"
                                title="Edit topic title or description"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveTopic(t.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                                title="Remove topic"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed pl-6.5">
                            {t.description}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleAddCustomTopic}
                  className="px-3 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Another Topic</span>
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-4 py-2 text-slate-600 hover:text-slate-900 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              type="button"
              onClick={handleConfirmTopics}
              disabled={saving || generatingTopics || topics.length < 5}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Saving Topics...</span>
                </>
              ) : (
                <>
                  <span>Confirm Topics & Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: DYNAMIC QR & NFC SETUP */}
      {step === 4 && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-900">Step 4 — Dynamic QR & NFC Setup</h2>
            <p className="text-xs text-slate-500 mt-1">
              Your business receives exactly one primary dynamic QR code and one primary NFC card assignment.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
            {/* Dynamic Route Info */}
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Permanent Public Dynamic Route
                </span>
                <div className="font-mono text-xs font-bold text-blue-700 bg-white p-2.5 rounded-xl border border-slate-200 truncate flex items-center justify-between">
                  <span>{`${window.location.origin}/r/${businessCode || 'loading'}`}</span>
                  <ExternalLink
                    className="w-3.5 h-3.5 cursor-pointer text-slate-400 hover:text-blue-600 shrink-0 ml-1"
                    onClick={() => window.open(`/r/${businessCode}`, '_blank')}
                  />
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Neither the NFC card nor the physical QR stand store Google's raw URL. If you change your Google link later, physical hardware never needs reprogramming.
                </p>
              </div>

              <div className="space-y-2 text-xs text-slate-700">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Primary NFC Card assigned & provisioned</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Dynamic QR Code linked to /r/{businessCode}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Scan tracking & analytics isolated to this business</span>
                </div>
              </div>
            </div>

            {/* Stand Preview Visual */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-36 h-36 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center p-3">
                <QrCode className="w-28 h-28 text-slate-900" />
              </div>
              <div>
                <span className="font-bold text-xs text-slate-900 block">{businessName}</span>
                <span className="text-[10px] text-slate-500 block">Tap NFC or Scan QR</span>
              </div>
              <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold">
                Stand Active & Ready
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="px-4 py-2 text-slate-600 hover:text-slate-900 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              type="button"
              onClick={() => setStep(5)}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Review Setup & Complete</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: REVIEW & COMPLETE */}
      {step === 5 && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-900">Step 5 — Complete & Activate</h2>
            <p className="text-xs text-slate-500 mt-1">
              Verify that all onboarding stages are passed. Only completed businesses can enter the production dashboard.
            </p>
          </div>

          <div className="space-y-3">
            {[
              { label: 'Business Information Saved', desc: `${businessName} (${category.replace(/_/g, ' ')}) in ${city}, ${stateName}`, valid: isStep1Valid },
              { label: 'Direct Google Review Destination', desc: googleReviewUrl, valid: isStep2Valid },
              { label: 'Confirmed Customer Experience Topics', desc: `${topics.length} topics ready for customer review generation`, valid: topics.length >= 5 },
              { label: 'Physical NFC Card Provisioned', desc: `Assigned to /r/${businessCode}`, valid: Boolean(businessCode) },
              { label: 'Dynamic QR Stand Provisioned', desc: `Active on /r/${businessCode}`, valid: Boolean(businessCode) },
              { label: 'Subscription Linked & Verified', desc: '1 subscription = 1 business isolated billing', valid: true }
            ].map((check, idx) => (
              <div key={idx} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-slate-900">{check.label}</div>
                  <div className="text-[11px] text-slate-500 truncate">{check.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-xs text-emerald-900 flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>
              All required onboarding stages are verified. Activating will change business status to <strong>ACTIVE</strong> and unlock your dashboard.
            </span>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setStep(4)}
              className="px-4 py-2 text-slate-600 hover:text-slate-900 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              type="button"
              onClick={handleCompleteOnboarding}
              disabled={saving}
              className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Activating Business Workspace...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Launch Business Dashboard</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
