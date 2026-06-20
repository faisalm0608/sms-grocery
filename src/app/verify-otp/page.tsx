'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getConfirmationResult } from '@/lib/firebase';
import { customersService } from '@/lib/services/customers';
import { ShieldAlert, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function VerifyOtp() {
  const router = useRouter();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [mobile, setMobile] = useState('');
  const [confirmation, setConfirmation] = useState<any>(null);

  useEffect(() => {
    const sessionState = getConfirmationResult();
    if (!sessionState || !sessionState.confirmation) {
      // If no active OTP request, redirect to login
      router.push('/login');
      return;
    }
    setMobile(sessionState.mobile);
    setConfirmation(sessionState.confirmation);
  }, [router]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (otp.length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    if (!confirmation) {
      setError('Verification session is missing. Please start over.');
      return;
    }

    setLoading(true);
    try {
      // Confirm the OTP code with Firebase Auth
      const result = await confirmation.confirm(otp);
      
      if (result.user) {
        // Register or load the customer record in Firestore
        await customersService.createOrUpdateCustomer(mobile, 'Valued Customer');
        
        setSuccess(true);
        setTimeout(() => {
          router.push('/');
        }, 1500);
      } else {
        throw new Error('Verification failed. Invalid response.');
      }
    } catch (err: any) {
      console.error('OTP confirmation error:', err);
      if (err.code === 'auth/invalid-verification-code') {
        setError('Invalid OTP code. Please check and try again.');
      } else if (err.code === 'auth/code-expired') {
        setError('This verification code has expired. Please request a new one.');
      } else {
        setError(err.message || 'OTP verification failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!confirmation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-background text-foreground transition-colors p-4 md:p-8">
      
      {/* Header */}
      <header className="max-w-7xl mx-auto w-full flex items-center justify-start py-4 border-b border-border-color/30">
        <Link href="/login" className="flex items-center gap-2 text-foreground/80 hover:text-foreground font-bold transition-all">
          <ArrowLeft className="h-4 w-4" />
          <span>Change Mobile Number</span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center py-12">
        <div className="w-full max-w-md bg-card-bg rounded-3xl border border-border-color p-8 shadow-2xl space-y-6 relative overflow-hidden transition-all duration-300">
          
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full pointer-events-none" />

          {success ? (
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-4 animate-fade-in">
              <CheckCircle2 className="h-16 w-16 text-primary animate-bounce" />
              <h2 className="text-2xl font-black text-foreground">Phone Verified!</h2>
              <p className="text-sm text-foreground/60">Logging you in securely. Please wait...</p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1 text-xs text-primary font-bold">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  <span>SMS Verification</span>
                </div>
                <h1 className="text-3xl font-black tracking-tight text-foreground">Enter OTP</h1>
                <p className="text-sm text-foreground/50 leading-relaxed">
                  We have sent a 6-digit text message code to **+91 {mobile}**.
                </p>
              </div>

              {error && (
                <div className="rounded-xl bg-red-500/10 p-3.5 text-xs font-bold text-red-500 border border-red-500/20">
                  {error}
                </div>
              )}

              <form onSubmit={handleVerify} className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-xs font-black text-foreground/60 uppercase tracking-widest text-center">
                    6-Digit Verification Code
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="000 000"
                    maxLength={6}
                    className="w-full tracking-[0.75em] text-center rounded-2xl border border-border-color bg-background/50 py-4 text-xl font-extrabold text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    disabled={loading}
                    required
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-black text-white hover:bg-primary-hover shadow-lg shadow-primary/20 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Verifying Code...</span>
                    </>
                  ) : (
                    <span>Verify & Continue</span>
                  )}
                </button>
              </form>

              <div className="pt-2 text-center text-xs">
                <span className="text-foreground/45">Didn't get the SMS? </span>
                <Link href="/login" className="text-primary font-bold hover:underline">
                  Resend OTP
                </Link>
              </div>
            </>
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
