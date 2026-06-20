'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  signOut 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { 
  ChevronRight, 
  Store, 
  Loader2, 
  ArrowLeft, 
  ShieldCheck, 
  MapPin, 
  Phone, 
  Lock, 
  User 
} from 'lucide-react';
import Link from 'next/link';

export default function CustomerLogin() {
  const router = useRouter();
  
  // Login Steps: 1 = Phone Input, 2 = OTP Input, 3 = New User Registration
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Input fields
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');

  // Firebase auth references
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [authUser, setAuthUser] = useState<any>(null);
  const recaptchaVerifierRef = useRef<any>(null);

  // OTP resend timer countdown
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Clean up recaptcha widget on unmount
  useEffect(() => {
    return () => {
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch (e) {
          console.error('Recaptcha clear error:', e);
        }
      }
    };
  }, []);

  const setupRecaptcha = () => {
    setError('');
    try {
      if (recaptchaVerifierRef.current) {
        return recaptchaVerifierRef.current;
      }

      const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          // reCAPTCHA solved
          console.log('reCAPTCHA solved successfully');
        },
        'expired-callback': () => {
          setError('reCAPTCHA expired. Please try sending OTP again.');
          setLoading(false);
        }
      });
      recaptchaVerifierRef.current = verifier;
      return verifier;
    } catch (err: any) {
      console.error('Recaptcha initialization error:', err);
      setError('Failed to initialize security verifier. Please refresh the page.');
      return null;
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const cleanMobile = mobile.replace(/\D/g, '');

    if (cleanMobile.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    try {
      const appVerifier = setupRecaptcha();
      if (!appVerifier) {
        setLoading(false);
        return;
      }

      // Firebase Phone Auth expects E.164 country format (+91 for India)
      const formattedPhoneNumber = `+91${cleanMobile}`;
      
      const sendPromise = signInWithPhoneNumber(auth, formattedPhoneNumber, appVerifier);
      const timeoutPromise = new Promise<any>((_, reject) => 
        setTimeout(() => reject(new Error('OTP request timed out. Please verify your internet connection or check if Firebase services are blocked.')), 10000)
      );

      const result = await Promise.race([sendPromise, timeoutPromise]);
      
      setConfirmationResult(result);
      setStep(2);
      setCountdown(30); // Start 30s resend cooldown
    } catch (err: any) {
      console.error('SMS sending error:', err);
      if (err.code === 'auth/invalid-phone-number') {
        setError('Invalid mobile number format.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many OTP attempts. Please wait a few minutes before trying again.');
      } else {
        setError(err.message || 'Failed to send OTP code. Please try again.');
      }
      // Reset recaptcha widget if it fails
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
          recaptchaVerifierRef.current = null;
        } catch (e) {}
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0 || loading) return;
    setError('');
    setLoading(true);
    const cleanMobile = mobile.replace(/\D/g, '');
    try {
      const appVerifier = setupRecaptcha();
      if (!appVerifier) {
        setLoading(false);
        return;
      }
      const formattedPhoneNumber = `+91${cleanMobile}`;
      const result = await signInWithPhoneNumber(auth, formattedPhoneNumber, appVerifier);
      setConfirmationResult(result);
      setCountdown(60); // 60s cooldown on second attempt
      setOtp('');
    } catch (err: any) {
      console.error('Resend OTP error:', err);
      setError(err.message || 'Failed to resend verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (otp.length !== 6) {
      setError('Please enter the 6-digit OTP code sent to your phone.');
      return;
    }

    if (!confirmationResult) {
      setError('Verification session expired. Please enter your mobile number again.');
      setStep(1);
      return;
    }

    setLoading(true);
    try {
      const verifyPromise = confirmationResult.confirm(otp);
      const timeoutPromise = new Promise<any>((_, reject) =>
        setTimeout(() => reject(new Error('OTP verification timed out. Please check your network connection.')), 8000)
      );

      const result = await Promise.race([verifyPromise, timeoutPromise]);
      const user = result.user;
      setAuthUser(user);

      // check if customer profile document exists in Firestore
      const cleanMobile = mobile.replace(/\D/g, '');
      const docRef = doc(db, "customers", cleanMobile);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        // Customer profile already exists, redirect to storefront
        router.push('/');
      } else {
        // New user! Display registration details to collect mobile & address
        setStep(3);
      }
    } catch (err: any) {
      console.error('OTP code verification error:', err);
      if (err.code === 'auth/invalid-verification-code') {
        setError('Incorrect verification code. Please check and try again.');
      } else {
        setError(err.message || 'Failed to verify verification code.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }

    if (!address.trim()) {
      setError('Please enter your delivery address.');
      return;
    }

    if (!authUser) {
      setError('Session expired. Please start the login process again.');
      setStep(1);
      return;
    }

    setLoading(true);
    try {
      const cleanMobile = mobile.replace(/\D/g, '');
      const docRef = doc(db, "customers", cleanMobile);
      const now = new Date().toISOString();

      const newCustomer = {
        id: cleanMobile,
        mobileNumber: cleanMobile,
        name: name.trim(),
        email: authUser.email || '',
        address: address.trim(),
        totalSpend: 0,
        loyaltyPoints: 0,
        createdAt: now,
        updatedAt: now
      };

      const writePromise = setDoc(docRef, newCustomer);
      const timeoutPromise = new Promise<any>((_, reject) => 
        setTimeout(() => reject(new Error('Firestore profile creation timed out.')), 8000)
      );

      await Promise.race([writePromise, timeoutPromise]);
      
      // Profile created, redirect to home page
      router.push('/');
    } catch (err: any) {
      console.error('Profile creation error:', err);
      setError(err.message || 'Failed to complete profile registration. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToPhone = async () => {
    setError('');
    setLoading(true);
    try {
      await signOut(auth);
    } catch (e) {}
    setConfirmationResult(null);
    setAuthUser(null);
    setOtp('');
    setStep(1);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-background text-foreground transition-colors p-4 md:p-8">
      
      {/* Invisible Recaptcha target */}
      <div id="recaptcha-container" />

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

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center py-12">
        <div className="w-full max-w-md bg-card-bg rounded-3xl border border-border-color p-8 shadow-2xl space-y-6 relative overflow-hidden transition-all duration-300 animate-scale-in">
          
          {/* Subtle decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full pointer-events-none" />

          {error && (
            <div className="rounded-xl bg-red-500/10 p-3.5 text-xs font-bold text-red-500 border border-red-500/20">
              {error}
            </div>
          )}

          {step === 1 && (
            /* Step 1: Mobile Number Entry */
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1 text-xs text-primary font-bold">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Secure Customer Portal</span>
                </div>
                <h1 className="text-3xl font-black tracking-tight text-foreground">Customer Login</h1>
                <p className="text-sm text-foreground/50 leading-relaxed">
                  Enter your 10-digit mobile number to verify your identity and manage checkout orders.
                </p>
              </div>

              <form onSubmit={handleSendOtp} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-foreground/60 uppercase tracking-widest">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-foreground/45 font-bold text-sm">
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

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-black text-white hover:bg-primary-hover shadow-lg shadow-primary/20 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Sending OTP...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Verification OTP</span>
                      <ChevronRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="pt-4 border-t border-border-color/30 flex items-center justify-between text-xs">
                <span className="text-foreground/45">Are you the owner?</span>
                <Link href="/admin/login" className="text-primary font-bold hover:underline">
                  Owner Dashboard Login
                </Link>
              </div>
            </div>
          )}

          {step === 2 && (
            /* Step 2: OTP Verification Code Entry */
            <div className="space-y-6 animate-fade-in">
              <div className="space-y-2">
                <h2 className="text-2xl font-black tracking-tight text-foreground">Verify OTP</h2>
                <p className="text-sm text-foreground/50 leading-relaxed">
                  We sent a 6-digit verification code to the number **+91 {mobile}**.
                </p>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-foreground/60 uppercase tracking-widest">
                    Verification Code
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-3.5 h-4.5 w-4.5 text-foreground/40" />
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter 6-digit verification code"
                      maxLength={6}
                      className="w-full rounded-2xl border border-border-color bg-background/50 py-3.5 pl-12 pr-4 text-sm font-bold text-center tracking-widest text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      disabled={loading}
                      required
                      autoFocus
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
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <span>Verify and Login</span>
                      <ChevronRight className="h-4 w-4" />
                    </>
                  )}
                </button>

                <div className="flex flex-col gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={countdown > 0 || loading}
                    className="text-center text-xs font-bold text-primary disabled:text-foreground/30 hover:underline transition-all cursor-pointer"
                  >
                    {countdown > 0 ? `Resend OTP code in ${countdown}s` : 'Resend OTP verification code'}
                  </button>

                  <button
                    type="button"
                    onClick={handleBackToPhone}
                    disabled={loading}
                    className="text-center text-xs text-foreground/45 hover:text-foreground hover:underline font-bold transition-all py-1 cursor-pointer"
                  >
                    Back to Mobile Number Entry
                  </button>
                </div>
              </form>
            </div>
          )}

          {step === 3 && (
            /* Step 3: Complete Customer Registration Details */
            <div className="space-y-6 animate-fade-in">
              <div className="space-y-2">
                <h2 className="text-2xl font-black tracking-tight text-foreground">Create Profile</h2>
                <p className="text-sm text-foreground/50 leading-relaxed">
                  Your phone number **+91 {mobile}** is verified! Please enter your name and delivery address to finish your profile setup.
                </p>
              </div>

              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                {/* Name */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-foreground/60 uppercase tracking-widest">
                    Your Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-3.5 h-4.5 w-4.5 text-foreground/40" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your full name"
                      className="w-full rounded-2xl border border-border-color bg-background/50 py-3.5 pl-12 pr-4 text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
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
                  onClick={handleBackToPhone}
                  disabled={loading}
                  className="w-full text-center text-xs text-foreground/45 hover:text-foreground hover:underline font-bold transition-all py-1 cursor-pointer"
                >
                  Cancel and Sign-out
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
