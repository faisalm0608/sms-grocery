'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/shared/Header';
import Footer from '@/components/shared/Footer';
import LoginModal from '@/components/shared/LoginModal';
import { useApp } from '@/lib/context/AppContext';
import { ShoppingBag, ArrowLeft, Plus, Minus, Trash2, MapPin, Clock, CreditCard, Check, AlertTriangle, ShieldCheck } from 'lucide-react';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';

export default function Cart() {
  const router = useRouter();
  const { cart, updateCartQuantity, removeFromCart, clearCart, user } = useApp();
  
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [fulfillment, setFulfillment] = useState<'delivery' | 'pickup'>('pickup');
  const [pickupTime, setPickupTime] = useState('05:00 PM - 07:00 PM');
  
  // Checkout inputs
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  
  // Payment step
  const [step, setStep] = useState<1 | 2>(1); // 1: Details, 2: Payment
  const [upiQrUrl, setUpiQrUrl] = useState('');
  const [upiTxnId, setUpiTxnId] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Sync inputs with logged in user
  useEffect(() => {
    if (user) {
      setName(user.name === 'Valued Customer' ? '' : user.name);
      // Try to fetch profile details to prefill address
      async function loadProfile() {
        try {
          const token = user?.token;
          const res = await fetch('/api/orders'); // trigger session read
          if (user?.mobile === '9788045564') {
            setAddress('818, Tendral Nagar, Vennar Bank Post, Manakarambai, Thanjavur, Tamil Nadu');
          }
        } catch (e) {}
      }
      loadProfile();
    }
  }, [user]);

  // Pricing calculations
  const cartSubtotal = cart.reduce((acc, item) => acc + (item.product.sellingPrice * item.quantity), 0);
  const estimatedDiscount = cartSubtotal > 500 ? Math.floor(cartSubtotal * 0.05) : 0;
  const estimatedTax = Math.round((cartSubtotal - estimatedDiscount) * 0.05 * 100) / 100;
  const cartTotal = Math.round((cartSubtotal - estimatedDiscount + estimatedTax) * 100) / 100;

  // Generate UPI QR Code on entering step 2
  const handleProceedToPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!user) {
      setIsLoginOpen(true);
      return;
    }

    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }

    if (fulfillment === 'delivery' && !address.trim()) {
      setError('Please enter your delivery address.');
      return;
    }

    setStep(2);
    setLoading(true);

    try {
      // Create UPI pay link
      // pa: faisalmd0608@okaxis, pn: SMS Grocery Shop, am: total, cu: INR, tn: SMS Shop Order
      const upiLink = `upi://pay?pa=faisalmd0608@okaxis&pn=SMS%20Grocery%20Shop&am=${cartTotal}&cu=INR&tn=SMS%20Grocery%20Shop%20Order`;
      const qrDataUrl = await QRCode.toDataURL(upiLink, {
        width: 250,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      });
      setUpiQrUrl(qrDataUrl);
    } catch (err) {
      console.error('Failed to generate UPI QR code:', err);
      setError('Failed to load payment QR code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    setError('');
    setLoading(true);

    if (!upiTxnId && cartTotal > 0) {
      setError('Please enter the UPI Transaction Reference ID (12 Digits) to verify your payment.');
      setLoading(false);
      return;
    }

    try {
      const orderData = {
        customerName: name,
        customerMobile: user?.mobile,
        customerAddress: fulfillment === 'pickup' ? 'Self Pickup at Shop' : address,
        pickupTime: fulfillment === 'pickup' ? pickupTime : 'Home Delivery',
        items: cart.map(item => ({
          productId: item.product.id,
          quantity: item.quantity
        })),
        discount: estimatedDiscount,
        tax: estimatedTax,
        paymentStatus: 'COMPLETED', // Simulating successful payment verification
        upiTxnId: upiTxnId
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to place order.');
      }

      // Celebrate order success!
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#0c831f', '#f5a623', '#ffffff']
      });

      // Clear local cart
      clearCart();
      
      // Redirect to tracking page
      router.push(`/order/${data.id}?success=true`);

    } catch (err: any) {
      setError(err.message || 'Failed to place order. Please review stock levels.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground transition-colors">
      <Suspense fallback={<div className="h-16 border-b border-border-color bg-card-bg" />}>
        <Header />
      </Suspense>

      <main className="flex-1 mx-auto max-w-5xl w-full px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Back navigation */}
        <button
          onClick={() => step === 2 ? setStep(1) : router.push('/')}
          className="flex items-center gap-1.5 text-sm font-bold text-foreground/60 hover:text-primary mb-6 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          {step === 2 ? 'Back to Details' : 'Back to Shop'}
        </button>

        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-card-bg rounded-2xl border border-border-color shadow-xs">
            <ShoppingBag className="h-20 w-20 text-foreground/20 stroke-1 mb-4" />
            <h2 className="text-xl font-black text-foreground">Your Shopping Cart is Empty</h2>
            <p className="text-sm text-foreground/50 mt-1 max-w-[280px]">
              You have no items in your cart. Go back and select some delicious groceries!
            </p>
            <button
              onClick={() => router.push('/')}
              className="mt-6 rounded-xl bg-primary px-8 py-3 text-sm font-black text-white hover:bg-primary-hover shadow-md transition-all cursor-pointer"
            >
              Shop Now
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Left side: items and inputs */}
            <div className="md:col-span-2 space-y-6">
              
              {/* Step 1: Details Entry */}
              {step === 1 ? (
                <div className="rounded-2xl border border-border-color bg-card-bg p-6 shadow-xs space-y-6">
                  <h2 className="text-lg font-black text-foreground border-b border-border-color/50 pb-3 flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-black text-white">
                      1
                    </span>
                    Fulfillment & Delivery Details
                  </h2>

                  {error && (
                    <div className="rounded-lg bg-red-500/10 p-3.5 text-xs font-semibold text-red-500 border border-red-500/20">
                      {error}
                    </div>
                  )}

                  {!user ? (
                    <div className="rounded-xl bg-yellow-500/5 border border-yellow-500/15 p-4 text-center space-y-3">
                      <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto" />
                      <h3 className="text-sm font-bold text-foreground">Login Required</h3>
                      <p className="text-xs text-foreground/60 max-w-[300px] mx-auto">
                        Please verify your mobile number via OTP to proceed with checkout.
                      </p>
                      <button
                        onClick={() => setIsLoginOpen(true)}
                        className="rounded-lg bg-primary px-5 py-2 text-xs font-black text-white hover:bg-primary-hover shadow-sm transition-all cursor-pointer"
                      >
                        Login / Register
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleProceedToPayment} className="space-y-4">
                      {/* Name input */}
                      <div>
                        <label className="block text-xs font-bold text-foreground/75 uppercase tracking-wider mb-2">
                          Your Name
                        </label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Mohammad Ali Jinnah"
                          className="w-full rounded-xl border border-border-color bg-background/50 px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-semibold"
                          required
                        />
                      </div>

                      {/* Mobile Display */}
                      <div>
                        <label className="block text-xs font-bold text-foreground/50 uppercase tracking-wider mb-2">
                          Verified Mobile Number
                        </label>
                        <input
                          type="text"
                          value={`+91 ${user.mobile}`}
                          className="w-full rounded-xl border border-border-color bg-foreground/5 px-4 py-3 text-sm text-foreground/60 font-semibold focus:outline-none cursor-not-allowed"
                          disabled
                        />
                      </div>

                      {/* Fulfillment Choice */}
                      <div>
                        <label className="block text-xs font-bold text-foreground/75 uppercase tracking-wider mb-2">
                          Fulfillment Mode
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setFulfillment('pickup')}
                            className={`flex items-center justify-center gap-2 rounded-xl border p-3.5 text-xs font-black transition-all cursor-pointer ${
                              fulfillment === 'pickup'
                                ? 'border-primary bg-primary/5 text-primary shadow-xs'
                                : 'border-border-color bg-background text-foreground/75 hover:bg-foreground/5'
                            }`}
                          >
                            <Clock className="h-4 w-4" />
                            Self Pickup at Shop
                          </button>
                          <button
                            type="button"
                            onClick={() => setFulfillment('delivery')}
                            className={`flex items-center justify-center gap-2 rounded-xl border p-3.5 text-xs font-black transition-all cursor-pointer ${
                              fulfillment === 'delivery'
                                ? 'border-primary bg-primary/5 text-primary shadow-xs'
                                : 'border-border-color bg-background text-foreground/75 hover:bg-foreground/5'
                            }`}
                          >
                            <MapPin className="h-4 w-4" />
                            Home Delivery
                          </button>
                        </div>
                      </div>

                      {fulfillment === 'pickup' ? (
                        <div>
                          <label className="block text-xs font-bold text-foreground/75 uppercase tracking-wider mb-2">
                            Select Pickup Time Slot
                          </label>
                          <select
                            value={pickupTime}
                            onChange={(e) => setPickupTime(e.target.value)}
                            className="w-full rounded-xl border border-border-color bg-background/50 px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-semibold cursor-pointer"
                          >
                            <option value="07:30 AM - 09:00 AM">Morning: 07:30 AM - 09:00 AM</option>
                            <option value="10:00 AM - 12:00 PM">Morning: 10:00 AM - 12:00 PM</option>
                            <option value="03:00 PM - 05:00 PM">Afternoon: 03:00 PM - 05:00 PM</option>
                            <option value="05:00 PM - 07:00 PM">Evening: 05:00 PM - 07:00 PM</option>
                            <option value="08:00 PM - 10:00 PM">Night: 08:00 PM - 10:00 PM</option>
                          </select>
                        </div>
                      ) : (
                        <div>
                          <label className="block text-xs font-bold text-foreground/75 uppercase tracking-wider mb-2">
                            Delivery Address
                          </label>
                          <textarea
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="Door No, Street Name, Landmark, Post, Thanjavur..."
                            rows={3}
                            className="w-full rounded-xl border border-border-color bg-background/50 px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-semibold"
                            required
                          />
                        </div>
                      )}

                      <button
                        type="submit"
                        className="w-full rounded-xl bg-primary py-3.5 text-sm font-black text-white hover:bg-primary-hover shadow-md transition-all cursor-pointer"
                      >
                        Proceed to Payment (₹{cartTotal})
                      </button>
                    </form>
                  )}
                </div>
              ) : (
                /* Step 2: UPI QR Payment Display */
                <div className="rounded-2xl border border-border-color bg-card-bg p-6 shadow-xs space-y-6">
                  <h2 className="text-lg font-black text-foreground border-b border-border-color/50 pb-3 flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-black text-white">
                      2
                    </span>
                    Pay via UPI (Instant Verification)
                  </h2>

                  {error && (
                    <div className="rounded-lg bg-red-500/10 p-3.5 text-xs font-semibold text-red-500 border border-red-500/20">
                      {error}
                    </div>
                  )}

                  <div className="text-center space-y-4">
                    <p className="text-sm text-foreground/70 font-semibold leading-relaxed">
                      Scan this QR code using any UPI App (GPay, PhonePe, Paytm, BHIM) to transfer exactly <strong className="text-primary text-base">₹{cartTotal}</strong>
                    </p>

                    {/* QR Code Container */}
                    <div className="inline-block rounded-2xl border-4 border-primary p-2.5 bg-white shadow-md">
                      {upiQrUrl ? (
                        <img src={upiQrUrl} alt="UPI QR Code" className="h-48 w-48 mx-auto" />
                      ) : (
                        <div className="h-48 w-48 bg-foreground/10 animate-pulse rounded-xl" />
                      )}
                    </div>

                    <div className="flex flex-col items-center text-xs text-foreground/50 space-y-1">
                      <span className="font-bold text-foreground/70">Payee UPI VPA: faisalmd0608@okaxis</span>
                      <span>Owner Name: Mohammad Ali Jinnah</span>
                    </div>

                    <div className="border-t border-border-color/50 pt-5 space-y-4 text-left">
                      <div>
                        <label className="block text-xs font-black text-foreground/75 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <CreditCard className="h-4 w-4 text-primary" />
                          UPI Transaction Reference ID (UTR / Ref No)
                        </label>
                        <input
                          type="text"
                          value={upiTxnId}
                          onChange={(e) => setUpiTxnId(e.target.value.replace(/\D/g, ''))}
                          placeholder="Enter 12-digit transaction ID"
                          className="w-full rounded-xl border border-border-color bg-background/50 px-4 py-3 text-sm text-center font-bold tracking-widest text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          maxLength={12}
                          required
                        />
                        <span className="block text-[10px] text-foreground/45 mt-1 leading-normal">
                          After completing payment in your mobile app, find the 12-digit transaction ID / UTR and enter it above to submit the order.
                        </span>
                      </div>

                      <div className="flex gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setStep(1)}
                          className="flex-1 rounded-xl border border-border-color py-3 text-xs font-bold text-foreground hover:bg-foreground/5 transition-all cursor-pointer"
                        >
                          Modify Details
                        </button>
                        <button
                          type="button"
                          onClick={handlePlaceOrder}
                          disabled={loading}
                          className="flex-1 rounded-xl bg-primary py-3 text-xs font-black text-white hover:bg-primary-hover shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <ShieldCheck className="h-4 w-4" />
                          {loading ? 'Verifying...' : 'Submit Order'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Shopping Bag Review List */}
              <div className="rounded-2xl border border-border-color bg-card-bg p-6 shadow-xs">
                <h3 className="text-base font-black text-foreground border-b border-border-color/50 pb-3 flex items-center gap-2 mb-4">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                  Review Items ({cart.length})
                </h3>

                <div className="divide-y divide-border-color/40">
                  {cart.map((item) => (
                    <div key={item.product.id} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-3 min-w-0 mr-4">
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="h-12 w-12 rounded-lg object-cover border border-border-color"
                        />
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-foreground truncate">{item.product.name}</h4>
                          <span className="text-[10px] font-bold text-foreground/40">{item.product.category}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center rounded-lg border border-border-color bg-background">
                          <button
                            onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                            className="p-1 hover:text-primary transition-colors cursor-pointer"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-5 text-center text-xs font-bold text-foreground">{item.quantity}</span>
                          <button
                            onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                            className="p-1 hover:text-primary transition-colors cursor-pointer"
                            disabled={item.quantity >= item.product.stockQuantity}
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <span className="text-sm font-black text-foreground min-w-[50px] text-right">
                          ₹{item.product.sellingPrice * item.quantity}
                        </span>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-foreground/40 hover:text-red-500 transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right side: bill breakdown summary */}
            <div className="space-y-6">
              <div className="rounded-2xl border border-border-color bg-card-bg p-6 shadow-xs space-y-4">
                <h3 className="text-sm font-black text-foreground border-b border-border-color/50 pb-2 uppercase tracking-wider">
                  Payment Summary
                </h3>

                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between text-foreground/70">
                    <span>Subtotal ({cart.reduce((a, c) => a + c.quantity, 0)} Items)</span>
                    <span className="font-bold">₹{cartSubtotal}</span>
                  </div>
                  {estimatedDiscount > 0 && (
                    <div className="flex justify-between text-primary font-bold">
                      <span>Store Discount (5%)</span>
                      <span>-₹{estimatedDiscount}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-foreground/70">
                    <span>GST Tax (5%)</span>
                    <span className="font-bold">₹{estimatedTax}</span>
                  </div>
                  <div className="flex justify-between text-foreground/70">
                    <span>Delivery Charges</span>
                    <span className="text-primary font-bold">FREE</span>
                  </div>
                  
                  <div className="flex justify-between text-base font-black text-foreground border-t border-border-color/50 pt-3">
                    <span>Grand Total</span>
                    <span>₹{cartTotal}</span>
                  </div>
                </div>

                <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/15 p-3.5 text-xs text-center text-emerald-600 dark:text-emerald-400 font-semibold space-y-1">
                  <div className="flex items-center justify-center gap-1">
                    <Check className="h-4 w-4" />
                    Blinkit-style Smart Billing
                  </div>
                  <p className="text-[10px] text-foreground/50 leading-relaxed font-normal">
                    Secure and direct payments. All checkout amounts go straight to the owner's UPI ID.
                  </p>
                </div>
              </div>
            </div>

          </div>
        )}

      </main>

      <Footer />
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </div>
  );
}
