import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Store,
  ArrowRight,
  ArrowLeft,
  Building2,
  MapPin,
  Phone,
  Mail,
  User,
  ShieldCheck,
  CreditCard,
  AlertCircle,
  Sparkles,
  QrCode
} from 'lucide-react';
import { useAuth } from '../../lib/auth-context.tsx';
import { useBusiness } from '../../lib/business-context.tsx';
import { syncBusinessToFirestore } from '../../lib/firestore-sync.ts';
import { freshTestApi } from '../../lib/fresh-test-api.ts';

const CATEGORIES = [
  { id: 'restaurant_cafe', label: 'Restaurant / Cafe / Food Katta' },
  { id: 'jewellery_gold', label: 'Jewellery & Gold Showroom' },
  { id: 'healthcare_clinic', label: 'Healthcare / Dental Clinic / Hospital' },
  { id: 'retail_store', label: 'Retail & Fashion Store' },
  { id: 'salon_spa', label: 'Salon, Beauty & Spa' },
  { id: 'supermarket_grocery', label: 'Supermarket & Kirana Grocery' },
  { id: 'hotel_resort', label: 'Hotel, Resort & Hospitality' },
  { id: 'automobile_services', label: 'Automobile Dealership & Workshop' },
  { id: 'professional_services', label: 'Professional & Business Services' },
  { id: 'other', label: 'Other Business / Store' }
];

export const CreateShopPage: React.FC = () => {
  const { user } = useAuth();
  const { refreshBusinesses, selectBusiness } = useBusiness();
  const navigate = useNavigate();

  const [shopName, setShopName] = useState('');
  const [category, setCategory] = useState('restaurant_cafe');
  const [ownerName, setOwnerName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Pune');
  const [stateName, setStateName] = useState('Maharashtra');
  const [pincode, setPincode] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!shopName.trim() || shopName.trim().length < 2) {
      setError('Please enter a valid shop or business name (at least 2 characters).');
      return;
    }
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      setError('Please provide a valid 10-digit mobile number.');
      return;
    }
    if (!address.trim() || address.trim().length < 5) {
      setError('Please provide your complete shop street address.');
      return;
    }
    if (!city.trim()) {
      setError('City is required.');
      return;
    }
    const cleanPincode = pincode.replace(/[^0-9]/g, '');
    if (cleanPincode.length !== 6) {
      setError('Please provide a valid 6-digit postal pincode.');
      return;
    }

    if (!user?.uid) {
      setError('You must be signed in to create a shop.');
      return;
    }

    try {
      setLoading(true);

      // Generate unique IDs for this shop
      const randomSuffix = crypto.randomUUID().replace(/-/g, '').substring(0, 8);
      const uniqueCode = `code_${randomSuffix}`;
      const shopId = `shop_${user.uid.substring(0, 6)}_${randomSuffix}`;
      const now = new Date().toISOString();

      const newShopPayload = {
        id: shopId,
        shopId: shopId,
        ownerUid: user.uid,
        ownerId: user.uid,
        businessName: shopName.trim(),
        shopName: shopName.trim(),
        category: category,
        description: `${shopName.trim()} in ${city.trim()}, ${stateName.trim()}`,
        ownerName: ownerName.trim() || user.displayName || 'Store Owner',
        email: email.trim() || user.email || '',
        phone: cleanPhone,
        address: address.trim(),
        city: city.trim(),
        state: stateName.trim(),
        pincode: cleanPincode,
        country: 'India',
        primaryLanguage: 'English',
        uniqueQrCode: uniqueCode,
        dynamicQrUrl: `https://qorbiqai.com/r/${uniqueCode}`,
        paymentStatus: 'unpaid' as const,
        onboardingStatus: 'payment_required' as const,
        onboardingCompleted: false,
        launchStatus: 'not_launched' as const,
        qrStatus: 'ACTIVE' as const,
        nfcStatus: 'ACTIVE' as const,
        createdAt: now,
        updatedAt: now
      };

      // 1. Direct Firestore write
      await syncBusinessToFirestore(newShopPayload);

      // 2. Authoritative API notification
      await freshTestApi.saveBusiness(newShopPayload, shopId).catch(() => {});

      // 3. Refresh context
      await refreshBusinesses().catch(() => {});
      await selectBusiness(shopId).catch(() => {});

      // 4. Immediately redirect to THAT SHOP's payment selection page
      navigate(`/app/pricing?shopId=${shopId}`, { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Failed to create shop. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-16">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link
            to="/app"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to My Shops</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
              <QrCode className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-sm tracking-tight text-slate-900">Qorbiq AI</span>
          </div>
        </div>
      </header>

      {/* Main Form Container */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider">
            <Store className="w-3.5 h-3.5" />
            <span>Multi-Shop Workspace</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Register a New Shop</h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            Every shop receives its own isolated review dashboard, permanent table stand QR, and contactless NFC routing.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
          
          {/* Shop Basics */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-blue-600 border-b border-slate-100 pb-2 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              <span>Shop Identity</span>
            </h2>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Shop / Store Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={shopName}
                onChange={e => setShopName(e.target.value)}
                placeholder="e.g., spiral katta, Shree Jewellers, Metro Cafe"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Business Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              >
                {CATEGORIES.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Contact Person Details */}
          <div className="space-y-4 pt-2">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-blue-600 border-b border-slate-100 pb-2 flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>Contact Person Details</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Owner / Manager Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={ownerName}
                  onChange={e => setOwnerName(e.target.value)}
                  placeholder="e.g., Sai Chakankar"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mobile Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="10-digit mobile number"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Business Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="store@business.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {/* Physical Address */}
          <div className="space-y-4 pt-2">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-blue-600 border-b border-slate-100 pb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>Physical Shop Address</span>
            </h2>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Street Address / Landmark <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="Shop No., Complex, Street, Area"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  City <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  placeholder="e.g., Pune"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  State <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={stateName}
                  onChange={e => setStateName(e.target.value)}
                  placeholder="e.g., Maharashtra"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pincode <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={pincode}
                  onChange={e => setPincode(e.target.value)}
                  placeholder="6-digit PIN"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
          </div>

          {/* Submission CTA */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>{loading ? 'Creating Shop Record...' : 'Proceed to Plan Activation'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <div className="text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>One-Time Cashfree payment (₹1,800 or ₹2,999) · Zero recurring debits</span>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
};
