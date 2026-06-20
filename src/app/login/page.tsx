'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { ChevronRight, Store, Loader2, ArrowLeft, ShieldCheck, Mail, MapPin, Phone } from 'lucide-react';
import Link from 'next/link';

export default function CustomerLogin() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Registration state for new Google users
  const [isNewUser, setIsNewUser] = useState(false);
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      if (!user.email) {
        throw new Error('Could not retrieve email from Google Account.');
      }

      // Query Firestore to check if a customer profile already exists for this Google email (with timeout)
      const q = query(collection(db, "customers"), where("email", "==", user.email));
      const queryPromise = getDocs(q);
      const queryTimeoutPromise = new Promise<any>((_, reject) => 
        setTimeout(() => reject(new Error('Connection timed out. Please check if your internet connection is active, or if firestore.googleapis.com is blocked by an ad-blocker or firewall.')), 8000)
      );

      const querySnapshot = await Promise.race([queryPromise, queryTimeoutPromise]);
      
      let existingCustomer: any = null;
      querySnapshot.forEach((doc: any) => {
        existingCustomer = doc.data();
      });

      if (existingCustomer) {
        // Customer profile exists, redirect to storefront
        router.push('/');
      } else {
        // New user! Display registration details to collect mobile & address
        setGoogleUser(user);
        setIsNewUser(true);
      }
    } catch (err: any) {
      console.error('Google login error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Login cancelled. Please try again.');
      } else {
        setError(err.message || 'Google Sign-in failed. Please try again.');
      }
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const cleanMobile = mobile.replace(/\D/g, '');
    
    if (cleanMobile.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (!googleUser) {
      setError('Session expired. Please sign in with Google again.');
      setIsNewUser(false);
      return;
    }

    setLoading(true);
    try {
      // Check if this mobile number is already registered under another account
      const docRef = doc(db, "customers", cleanMobile);
      const now = new Date().toISOString();

      const newCustomer = {
        id: cleanMobile,
        mobileNumber: cleanMobile,
        name: googleUser.displayName || 'Valued Customer',
        email: googleUser.email,
        address: address.trim(),
        totalSpend: 0,
        loyaltyPoints: 0,
        createdAt: now,
        updatedAt: now
      };

      // Save customer profile in Firestore with a timeout to avoid silent hangs
      const writePromise = setDoc(docRef, newCustomer);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database connection timed out. Please verify that your Cloud Firestore API is enabled, or check if an ad-blocker / firewall is blocking firestore.googleapis.com.')), 8000)
      );

      await Promise.race([writePromise, timeoutPromise]);

      // Successfully registered and logged in, redirect to store
      router.push('/');
    } catch (err: any) {
      console.error('Customer registration error:', err);
      setError(err.message || 'Failed to complete registration. Try again.');
      setLoading(false);
    }
  };

  const handleCancelRegistration = async () => {
    try {
      await signOut(auth);
    } catch (e) {}
    setIsNewUser(false);
    setGoogleUser(null);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-background text-foreground transition-colors p-4 md:p-8">
      
      {/* Header */}
      <header className="max-w-7xl mx-auto w-full flex items-center justify-between py-4 border-b border-border-color/30">
        <Link href="/" className="flex items-center gap-2 text-foreground/80 hover:text-foreground font-bold transition-all">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Store</span>
        </Link>
        <div className="flex items-center gap-2">
          <Store className="h-5 w-5 text-primary" />
          <span className="text-sm font-black tracking-tight">SMS Grocery Shop</span>
        </div>
      </header>

      {/* Main Form container */}
      <main className="flex-1 flex items-center justify-center py-12">
        <div className="w-full max-w-md bg-card-bg rounded-3xl border border-border-color p-8 shadow-2xl space-y-6 relative overflow-hidden transition-all duration-300 animate-scale-in">
          
          {/* Subtle decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full pointer-events-none" />

          {error && (
            <div className="rounded-xl bg-red-500/10 p-3.5 text-xs font-bold text-red-500 border border-red-500/20">
              {error}
            </div>
          )}

          {!isNewUser ? (
            /* Step 1: Google Login Button */
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1 text-xs text-primary font-bold">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Secure Customer Portal</span>
                </div>
                <h1 className="text-3xl font-black tracking-tight text-foreground">Customer Login</h1>
                <p className="text-sm text-foreground/50 leading-relaxed">
                  Sign in with Google to manage orders, checkout your cart, and track grocery deliveries.
                </p>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 rounded-2xl border border-border-color bg-background py-3.5 text-sm font-bold text-foreground hover:bg-foreground/5 hover:border-foreground/20 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    {/* Google SVG Icon */}
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path
                        fill="#EA4335"
                        d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.866-3.577-7.866-8s3.536-8 7.866-8c2.46 0 4.105 1.025 5.047 1.926l3.28-3.154C18.257 1.97 15.49 1 12.24 1 5.926 1 .8 6.002.8 12.2s5.126 11.2 11.44 11.2c6.6 0 11-4.643 11-11.2 0-.756-.08-1.334-.18-1.915H12.24z"
                      />
                    </svg>
                    <span>Continue with Google</span>
                  </>
                )}
              </button>

              <div className="pt-4 border-t border-border-color/30 flex items-center justify-between text-xs">
                <span className="text-foreground/45">Are you the owner?</span>
                <Link href="/admin/login" className="text-primary font-bold hover:underline">
                  Owner Dashboard Login
                </Link>
              </div>
            </div>
          ) : (
            /* Step 2: Customer Mobile & Address Form */
            <div className="space-y-6 animate-fade-in">
              <div className="space-y-2">
                <h2 className="text-2xl font-black tracking-tight text-foreground">Complete Profile</h2>
                <p className="text-sm text-foreground/50 leading-relaxed">
                  Hi **{googleUser?.displayName}**, please provide your phone number and address to finish setting up your account.
                </p>
              </div>

              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                {/* Mobile number */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-foreground/60 uppercase tracking-widest">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-foreground/40 font-bold text-sm">
                      +91
                    </span>
                    <input
                      type="tel"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter 10-digit mobile number"
                      maxLength={10}
                      className="w-full rounded-2xl border border-border-color bg-background/50 py-3.5 pl-14 pr-4 text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      disabled={loading}
                      required
                      autoFocus
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-foreground/60 uppercase tracking-widest">
                    Delivery Address
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-3.5 h-4.5 w-4.5 text-foreground/40" />
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Street, Area, LandMark, Thanjavur"
                      className="w-full rounded-2xl border border-border-color bg-background/50 py-3.5 pl-12 pr-4 text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-black text-white hover:bg-primary-hover shadow-lg shadow-primary/20 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <span>Complete Registration</span>
                      <ChevronRight className="h-4 w-4" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleCancelRegistration}
                  disabled={loading}
                  className="w-full text-center text-xs text-foreground/45 hover:text-foreground hover:underline font-bold transition-all py-1 cursor-pointer"
                >
                  Cancel Sign-in
                </button>
              </form>
            </div>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto w-full text-center py-4 text-xs text-foreground/35 font-semibold">
        © {new Date().getFullYear()} SMS Grocery Shop. All rights reserved.
      </footer>
    </div>
  );
}
