'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, setConfirmationResult } from '@/lib/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { Phone, ChevronRight, Store, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CustomerLogin() {
  const router = useRouter();
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);

  useEffect(() => {
    // Initialize reCAPTCHA verifier
    try {
      const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          // reCAPTCHA solved, will trigger signInWithPhoneNumber
        },
        'expired-callback': () => {
          setError('reCAPTCHA expired. Please try again.');
        }
      });
      setRecaptchaVerifier(verifier);
      
      return () => {
        verifier.clear();
      };
    } catch (e: any) {
      console.error('reCAPTCHA initialization error:', e);
    }
  }, []);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const cleanMobile = mobile.replace(/\D/g, '');
    if (cleanMobile.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (!recaptchaVerifier) {
      setError('reCAPTCHA is not initialized yet. Please wait a moment.');
      return;
    }

    setLoading(true);
    try {
      const formattedPhone = `+91${cleanMobile}`;
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier);
      
      // Save verification result and phone in state helper
      setConfirmationResult({
        confirmation,
        mobile: cleanMobile
      });
      
      router.push('/verify-otp');
    } catch (err: any) {
      console.error('Error sending SMS OTP:', err);
      if (err.code === 'auth/invalid-phone-number') {
        setError('Invalid phone number format. Please check the digits.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many login attempts. Please try again later.');
      } else {
        setError(err.message || 'Failed to send OTP code. Please try again.');
      }
      // Reset reCAPTCHA on error
      if ((window as any).grecaptcha && recaptchaVerifier) {
        (window as any).grecaptcha.reset();
      }
    } finally {
      setLoading(false);
    }
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
        <div className="w-full max-w-md bg-card-bg rounded-3xl border border-border-color p-8 shadow-2xl space-y-6 relative overflow-hidden transition-all duration-300">
          
          {/* Subtle decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full pointer-events-none" />

          <div className="space-y-2">
            <h1 className="text-3xl font-black tracking-tight text-foreground">Customer Login</h1>
            <p className="text-sm text-foreground/50 leading-relaxed">
              Verify your mobile number via real SMS OTP to place orders and track delivery.
            </p>
          </div>

          {error && (
            <div className="rounded-xl bg-red-500/10 p-3.5 text-xs font-bold text-red-500 border border-red-500/20">
              {error}
            </div>
          )}

          <form onSubmit={handleSendOtp} className="space-y-5">
            <div className="space-y-2">
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
                  placeholder="97880 45564"
                  maxLength={10}
                  className="w-full rounded-2xl border border-border-color bg-background/50 py-3.5 pl-14 pr-4 text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  disabled={loading}
                  required
                  autoFocus
                />
              </div>
            </div>

            {/* Invisible reCAPTCHA target */}
            <div id="recaptcha-container" className="hidden"></div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-black text-white hover:bg-primary-hover shadow-lg shadow-primary/20 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Sending SMS OTP...</span>
                </>
              ) : (
                <>
                  <span>Send OTP Code</span>
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
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto w-full text-center py-4 text-xs text-foreground/35 font-semibold">
        © {new Date().getFullYear()} SMS Grocery Shop. All rights reserved.
      </footer>
    </div>
  );
}
