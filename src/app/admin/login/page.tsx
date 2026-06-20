'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { Mail, Lock, Loader2, ArrowLeft, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Sign in with Firebase Email & Password
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Authorize: Enforce that only the designated owner email can access admin panel
      const adminEmail = 'admin@smsgrocery.com';
      if (user.email !== adminEmail) {
        // Sign out invalid user immediately
        await signOut(auth);
        throw new Error('Unauthorized. This account does not have owner access privileges.');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/admin');
      }, 1500);
    } catch (err: any) {
      console.error('Admin login error:', err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setError('Invalid admin credentials. Please double check email and password.');
      } else {
        setError(err.message || 'Failed to authenticate admin. Try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#090d16] text-white p-4 md:p-8">
      
      {/* Header */}
      <header className="max-w-7xl mx-auto w-full flex items-center justify-start py-4 border-b border-white/10">
        <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white font-semibold transition-all text-sm">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Storefront</span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center py-12">
        <div className="w-full max-w-md bg-[#111a2e] rounded-3xl border border-slate-800 p-8 shadow-2xl space-y-6 relative overflow-hidden transition-all duration-300">
          
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full pointer-events-none" />

          {success ? (
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-4 animate-fade-in">
              <ShieldCheck className="h-16 w-16 text-primary animate-bounce" />
              <h2 className="text-2xl font-black">Access Granted!</h2>
              <p className="text-sm text-slate-400">Loading shop manager. Please wait...</p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <h1 className="text-3xl font-black tracking-tight">Owner Login</h1>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Enter your administrative credentials to manage inventory, POS terminals, and profit reports.
                </p>
              </div>

              {error && (
                <div className="rounded-xl bg-red-500/10 p-3.5 text-xs font-bold text-red-500 border border-red-500/20">
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Owner Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-3.5 h-4.5 w-4.5 text-slate-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@smsgrocery.com"
                      className="w-full rounded-2xl border border-slate-850 bg-slate-900/50 py-3.5 pl-12 pr-4 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      disabled={loading}
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Security Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-3.5 h-4.5 w-4.5 text-slate-500" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-2xl border border-slate-850 bg-slate-900/50 py-3.5 pl-12 pr-4 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-black text-white hover:bg-primary-hover shadow-lg shadow-primary/25 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Verifying Owner Identity...</span>
                    </>
                  ) : (
                    <span>Authorized Sign In</span>
                  )}
                </button>
              </form>

              <div className="pt-2 text-center text-xs">
                <span className="text-slate-500">Not the owner? </span>
                <Link href="/login" className="text-primary font-bold hover:underline">
                  Customer Checkout Portal
                </Link>
              </div>
            </>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto w-full text-center py-4 text-xs text-slate-650 font-semibold">
        © {new Date().getFullYear()} SMS Grocery Shop. All rights reserved.
      </footer>
    </div>
  );
}
