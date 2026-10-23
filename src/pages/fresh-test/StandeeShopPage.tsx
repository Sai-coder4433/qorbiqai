import React, { useState, useEffect } from 'react';
import {
  Package,
  QrCode,
  Radio,
  Truck,
  CheckCircle2,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  MapPin,
  Phone,
  User,
  ShoppingBag,
  CreditCard,
  Printer,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../../lib/auth-context.tsx';
import { useBusiness } from '../../lib/business-context.tsx';
import { freshTestApi } from '../../lib/fresh-test-api.ts';
import { StandeeProduct, StandeeProductOrder } from '../../../server/reviewflow/types.ts';
import { openCashfreeCheckout } from '../../lib/cashfree.ts';

export const StandeeShopPage: React.FC = () => {
  const { user } = useAuth();
  const { activeBusiness, businesses } = useBusiness();

  const [activeTab, setActiveTab] = useState<'catalog' | 'my-orders'>('catalog');
  const [products, setProducts] = useState<StandeeProduct[]>([]);
  const [myOrders, setMyOrders] = useState<StandeeProductOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected Product & Customization
  const [selectedProductId, setSelectedProductId] = useState<string>('prod_hybrid_duo');
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>(activeBusiness?.id || '');
  const [customBrandName, setCustomBrandName] = useState<string>((activeBusiness as any)?.businessName || (activeBusiness as any)?.name || '');

  // Shipping Address Form
  const [fullName, setFullName] = useState(user?.displayName || '');
  const [phone, setPhone] = useState((user as any)?.phoneNumber || (user as any)?.phone || '');
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Maharashtra');
  const [pinCode, setPinCode] = useState('');
  const [landmark, setLandmark] = useState('');

  // Checkout State
  const [ordering, setOrdering] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState<StandeeProductOrder | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeBusiness) {
      setSelectedBusinessId(activeBusiness.id);
      if (!customBrandName) {
        setCustomBrandName((activeBusiness as any)?.businessName || (activeBusiness as any)?.name || '');
      }
    }
  }, [activeBusiness]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [prodRes, ordersRes] = await Promise.all([
        freshTestApi.getProducts().catch(() => ({ products: [] })),
        freshTestApi.getMyStandeeOrders().catch(() => ({ orders: [] }))
      ]);
      setProducts(prodRes.products || []);
      setMyOrders(ordersRes.orders || []);
      if (prodRes.products?.length > 0 && !selectedProductId) {
        setSelectedProductId(prodRes.products[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load standee shop catalog.');
    } finally {
      setLoading(false);
    }
  };

  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setOrderError(null);

    // Validation
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setOrderError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    const cleanPin = pinCode.replace(/\D/g, '');
    if (cleanPin.length !== 6) {
      setOrderError('Please enter a valid 6-digit Indian PIN code.');
      return;
    }

    if (!streetAddress.trim() || !city.trim()) {
      setOrderError('Please enter your complete street address and city.');
      return;
    }

    const targetBiz = businesses.find((b) => b.id === selectedBusinessId) || activeBusiness;
    if (!targetBiz) {
      setOrderError('Please select a business workspace for this standee.');
      return;
    }

    try {
      setOrdering(true);

      const orderRes = await freshTestApi.createStandeeOrder({
        productId: selectedProduct.id,
        businessId: targetBiz.id,
        quantity: 1,
        customization: {
          brandNameOnStandee: customBrandName || (targetBiz as any)?.businessName || (targetBiz as any)?.name || ''
        },
        shippingAddress: {
          fullName: fullName.trim(),
          phone: cleanPhone,
          streetAddress: streetAddress.trim(),
          city: city.trim(),
          state: state.trim(),
          pinCode: cleanPin,
          landmark: landmark.trim() || undefined
        }
      });

      // If Cashfree session is created, trigger popup checkout
      if (orderRes.paymentSessionId) {
        try {
          await openCashfreeCheckout({
            paymentSessionId: orderRes.paymentSessionId,
            mode: 'sandbox'
          });
        } catch (cfErr: any) {
          console.warn('Cashfree popup dismissed or finished:', cfErr);
        }
      }

      // Verify order payment on backend
      const verifyRes = await freshTestApi.verifyStandeeOrder(
        orderRes.order.id,
        orderRes.paymentId || 'DIRECT_MANDATE'
      );

      setOrderSuccess(verifyRes.order);
      await loadData();
      setActiveTab('my-orders');
    } catch (err: any) {
      setOrderError(err.message || 'Failed to complete standee order.');
    } finally {
      setOrdering(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Package className="w-7 h-7 text-blue-600" />
            <span>Countertop Standees & NFC Tags</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Official high-gloss acrylic stands with instant NTAG213 NFC chip & dynamic QR code for effortless 5-star Google Reviews.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'catalog'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            Order Standee
          </button>
          <button
            onClick={() => setActiveTab('my-orders')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'my-orders'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            My Orders ({myOrders.length})
          </button>
        </div>
      </div>

      {/* TAB 1: PRODUCT CATALOG & ORDER WIZARD */}
      {activeTab === 'catalog' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Product Selection & Live 3D Standee Preview (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                1. Select Hardware Type
              </label>

              <div className="space-y-3">
                {products.map((prod) => (
                  <div
                    key={prod.id}
                    onClick={() => setSelectedProductId(prod.id)}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                      selectedProductId === prod.id
                        ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          {prod.productType === 'QR_STANDEE' ? (
                            <QrCode className="w-4 h-4 text-blue-600" />
                          ) : prod.productType === 'NFC_STANDEE' ? (
                            <Radio className="w-4 h-4 text-indigo-600" />
                          ) : (
                            <Sparkles className="w-4 h-4 text-purple-600" />
                          )}
                          <span className="font-bold text-sm text-slate-900">{prod.name}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{prod.description}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-lg font-black text-slate-900">₹{prod.basePrice}</span>
                        <span className="text-[10px] text-slate-400 block">Inc. GST & Shipping</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Standee Realistic Visual Preview */}
            <div className="bg-slate-900 rounded-3xl p-6 text-white text-center space-y-4 shadow-xl border border-slate-800">
              <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">
                Hardware Design Preview
              </span>

              {/* Physical Acrylic Mockup */}
              <div className="relative mx-auto w-48 h-64 bg-gradient-to-b from-slate-800 to-slate-950 rounded-2xl border-2 border-slate-700/80 p-4 flex flex-col justify-between shadow-2xl overflow-hidden">
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-500/10 rounded-full blur-xl" />

                <div>
                  <div className="flex justify-center items-center gap-1 mb-1">
                    <span className="text-amber-400 text-xs">★★★★★</span>
                  </div>
                  <h4 className="text-xs font-black tracking-tight text-white line-clamp-1">
                    {customBrandName || (activeBusiness as any)?.businessName || (activeBusiness as any)?.name || 'Your Business Name'}
                  </h4>
                  <p className="text-[9px] text-slate-300 font-medium mt-0.5">Review Us On Google</p>
                </div>

                {/* Center Badge */}
                <div className="my-auto flex flex-col items-center">
                  <div className="bg-white p-2.5 rounded-xl shadow-lg inline-block">
                    <QrCode className="w-16 h-16 text-slate-900" />
                  </div>
                  {selectedProduct?.productType !== 'QR_STANDEE' && (
                    <div className="mt-2 flex items-center gap-1 bg-blue-600/30 border border-blue-400/40 px-2 py-0.5 rounded-full text-[9px] text-blue-200">
                      <Radio className="w-2.5 h-2.5 animate-pulse text-blue-300" />
                      <span>Tap with Smartphone</span>
                    </div>
                  )}
                </div>

                <div className="text-[8px] text-slate-400 font-mono tracking-wider">
                  POWERED BY QORBIQ AI
                </div>
              </div>

              <div className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Heavyweight Acrylic Base + Waterproof UV Print</span>
              </div>
            </div>
          </div>

          {/* Right Column: Customization & Delivery Form (7 cols) */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
            <form onSubmit={handlePlaceOrder} className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900">2. Standee Customization</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  We'll pre-encode your dynamic Google review destination before shipping.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Target Workspace <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedBusinessId}
                    onChange={(e) => {
                      setSelectedBusinessId(e.target.value);
                      const b = businesses.find((x) => x.id === e.target.value);
                      if (b) setCustomBrandName((b as any).businessName || (b as any).name || '');
                    }}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                  >
                    {businesses.map((biz) => (
                      <option key={biz.id} value={biz.id}>
                        {(biz as any).businessName || (biz as any).name || biz.id}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Brand Name Printed on Stand <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={customBrandName}
                    onChange={(e) => setCustomBrandName(e.target.value)}
                    placeholder="e.g. Blue Tokai Cafe"
                    required
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-5">
                <h3 className="text-lg font-bold text-slate-900">3. Shipping Address in India</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Delivered via Delhivery / Blue Dart within 3-5 business days across India.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Recipient Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    required
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    10-Digit Mobile Phone <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono">+91</span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="9876543210"
                      maxLength={10}
                      required
                      className="w-full pl-11 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="font-semibold text-slate-700 block mb-1">
                    Street Address & Shop / Unit # <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    placeholder="Shop No. 4, Ground Floor, MG Road Market"
                    required
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Landmark (Optional)</label>
                  <input
                    type="text"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    placeholder="Opposite City Hospital"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    6-Digit PIN Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                    placeholder="400001"
                    maxLength={6}
                    required
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    City <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Mumbai"
                    required
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    State <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="Maharashtra"
                    required
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Order Summary Box */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>{selectedProduct?.name}</span>
                  <span className="font-semibold text-slate-900">₹{selectedProduct?.basePrice}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Express Courier Shipping</span>
                  <span className="font-semibold text-emerald-600">FREE</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Customization & Pre-encoding</span>
                  <span className="font-semibold text-emerald-600">INCLUDED</span>
                </div>
                <div className="flex justify-between items-center text-sm font-black text-slate-900 border-t border-slate-200 pt-2">
                  <span>Total Amount:</span>
                  <span className="text-blue-600 text-base">₹{selectedProduct?.basePrice}</span>
                </div>
              </div>

              {orderError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{orderError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={ordering}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {ordering ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing Secure Payment...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span>Pay ₹{selectedProduct?.basePrice} via Cashfree</span>
                  </>
                )}
              </button>

              <p className="text-[11px] text-center text-slate-400">
                Encrypted 256-bit payment through Cashfree. Sequential tax invoice automatically generated upon capture.
              </p>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: MY ORDERS */}
      {activeTab === 'my-orders' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Your Standee Hardware Orders</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Track production, courier tracking codes, and download official invoices.
              </p>
            </div>
            <button
              onClick={loadData}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {myOrders.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">No Standee Orders Yet</p>
              <p className="text-xs text-slate-400">
                You haven't ordered any physical QR or NFC countertop stands yet.
              </p>
              <button
                onClick={() => setActiveTab('catalog')}
                className="mt-3 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                Explore Standee Catalog
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {myOrders.map((ord) => (
                <div key={ord.id} className="py-5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="font-mono text-xs font-bold text-blue-600">{ord.orderNumber}</span>
                      <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                        {ord.items?.[0]?.productName || 'ReviewFlow Standee'}
                      </h4>
                      <span className="text-xs text-slate-500">
                        Placed on {new Date(ord.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase ${
                          ord.orderStatus === 'DELIVERED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : ord.orderStatus === 'DISPATCHED' || ord.orderStatus === 'OUT_FOR_DELIVERY'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {ord.orderStatus.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Delivery & Courier Status */}
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 text-xs grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Shipping To
                      </span>
                      <div className="font-semibold text-slate-800 mt-0.5">{ord.shippingAddress?.fullName}</div>
                      <div className="text-slate-600">{ord.shippingAddress?.streetAddress}</div>
                      <div className="text-slate-600">
                        {ord.shippingAddress?.city}, {ord.shippingAddress?.state} —{' '}
                        <span className="font-mono">{ord.shippingAddress?.pinCode}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Fulfillment & Tracking
                      </span>
                      {ord.trackingNumber ? (
                        <div className="mt-0.5 space-y-1">
                          <div className="font-semibold text-slate-800">
                            Courier: {ord.courierProvider}
                          </div>
                          <div className="font-mono text-slate-700">
                            AWB: {ord.trackingNumber}
                          </div>
                          {ord.trackingUrl && (
                            <a
                              href={ord.trackingUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                            >
                              <span>Track Live Shipment</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      ) : (
                        <div className="text-slate-500 mt-1 italic">
                          In preparation & encoding at production facility.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
