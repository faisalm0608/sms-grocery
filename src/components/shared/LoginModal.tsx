'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/context/AppContext';
import { X, Phone, Lock, ChevronRight, CheckCircle } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { login } = useApp();
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<1 | 2>(1);
  const [sentOtp, setSentOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const cleanMobile = mobile.replace(/\D/g, '');
    if (cleanMobile.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobileNumber: cleanMobile })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to send OTP');
      }

      setSentOtp(data.otp);
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (otp.length < 4) {
      setError('Please enter the 4-digit OTP.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobileNumber: mobile.replace(/\D/g, ''), otp })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'OTP verification failed');
      }

      login({
        mobile: data.user.mobile,
        name: data.user.name,
        role: data.user.role,
        token: data.token
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setStep(1);
        setMobile('');
        setOtp('');
        onClose();
        // Force refresh for route updates if necessary
        window.location.reload();
      }, 1500);

    } catch (err: any) {
      setError(err.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in no-print">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border-color bg-card-bg p-6 shadow-2xl animate-scale-in">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-foreground/50 hover:text-foreground hover:bg-foreground/10 rounded-full p-1.5 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {success ? (
          <div className="flex flex-col items-center justify-center py-8 text-center animate-fade-in">
            <CheckCircle className="h-16 w-16 text-primary mb-4 animate-bounce" />
            <h3 className="text-xl font-bold text-foreground">Welcome Back!</h3>
            <p className="text-sm text-foreground/60 mt-1">Logged in successfully.</p>
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-extrabold text-foreground tracking-tight">SMS Grocery Shop</h2>
              <p className="text-sm text-foreground/60 mt-1">
                {step === 1 
                  ? 'Verify your mobile number to checkout or track orders.' 
                  : 'Enter the 4-digit verification code sent to your mobile.'}
              </p>
            </div>

            {error && (
              <div className="mb-4 rounded-lg bg-red-500/10 p-3 text-xs font-semibold text-red-500 border border-red-500/20">
                {error}
              </div>
            )}

            {step === 1 ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-foreground/70 uppercase tracking-wider mb-2">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-foreground/40 font-medium">
                      +91
                    </span>
                    <input
                      type="tel"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      placeholder="97880 45564"
                      className="w-full rounded-xl border border-border-color bg-background/50 py-3 pl-12 pr-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium"
                      disabled={loading}
                      maxLength={15}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-white shadow-md hover:bg-primary-hover active:scale-95 transition-all cursor-pointer"
                >
                  {loading ? 'Sending OTP...' : 'Get OTP'}
                  <ChevronRight className="h-4 w-4" />
                </button>

                <div className="rounded-xl bg-yellow-500/5 p-3 text-xs text-yellow-600 dark:text-yellow-400 border border-yellow-500/15 leading-relaxed">
                  <strong>Testing Tip:</strong> Enter <strong>9788045564</strong> to login as <strong>Mohammad Ali Jinnah (Owner/Admin)</strong>. Other numbers login as customers.
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold text-foreground/70 uppercase tracking-wider">
                      Enter 4-Digit OTP
                    </label>
                    <button 
                      type="button" 
                      onClick={() => setStep(1)} 
                      className="text-xs text-primary hover:underline font-semibold"
                    >
                      Change Number
                    </button>
                  </div>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter OTP"
                    className="w-full text-center tracking-widest rounded-xl border border-border-color bg-background/50 py-3 text-lg font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    disabled={loading}
                    maxLength={4}
                    required
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-white shadow-md hover:bg-primary-hover active:scale-95 transition-all cursor-pointer"
                >
                  {loading ? 'Verifying...' : 'Verify & Login'}
                </button>

                {sentOtp && (
                  <div className="rounded-xl bg-emerald-500/10 p-3 text-center text-xs text-emerald-600 dark:text-emerald-400 border border-emerald-500/15 font-semibold">
                    Simulated SMS OTP: <span className="text-sm font-mono font-bold tracking-wider">{sentOtp}</span> (or enter 1234)
                  </div>
                )}
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
