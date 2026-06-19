'use client';

import React from 'react';
import Link from 'next/link';
import { MapPin, Phone, MessageSquare, Clock, CreditCard } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full border-t border-border-color bg-card-bg transition-colors mt-auto no-print">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Column 1: About */}
          <div className="space-y-4">
            <h3 className="text-lg font-black text-primary tracking-tight">SMS Grocery Shop</h3>
            <p className="text-sm text-foreground/60 leading-relaxed">
              Your neighborhood digital supermarket in Thanjavur. Sourcing the freshest farm products, dairy essentials, and home needs daily.
            </p>
            <div className="flex gap-2">
              <a
                href="tel:+919788045564"
                className="flex items-center gap-1 text-xs font-bold bg-blue-600/10 hover:bg-blue-600/20 text-blue-600 dark:text-blue-400 rounded-full px-3 py-1.5 transition-all"
              >
                <Phone className="h-3.5 w-3.5" />
                Call Store
              </a>
              <a
                href="https://wa.me/919788045564"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full px-3 py-1.5 transition-all"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                WhatsApp
              </a>
            </div>
          </div>

          {/* Column 2: Hours & Schedule */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-foreground/80 uppercase tracking-wider">Business Info</h4>
            <ul className="space-y-2.5 text-sm text-foreground/60">
              <li className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <strong className="block text-foreground/80">Hours:</strong>
                  7:00 AM – 10:30 PM (All Days)
                </div>
              </li>
              <li className="flex items-start gap-2">
                <CreditCard className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <strong className="block text-foreground/80">UPI ID:</strong>
                  <span className="font-mono select-all">faisalmd0608@okaxis</span>
                </div>
              </li>
            </ul>
          </div>

          {/* Column 3: Contact Address */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-foreground/80 uppercase tracking-wider">Shop Location</h4>
            <div className="flex items-start gap-2 text-sm text-foreground/60 leading-relaxed">
              <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div>
                <strong className="block text-foreground/80">Owner: Mohammad Ali Jinnah</strong>
                818, Tendral Nagar,<br />
                Vennar Bank Post,<br />
                Manakarambai, Thanjavur,<br />
                Tamil Nadu, India.
              </div>
            </div>
          </div>

          {/* Column 4: Links */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-foreground/80 uppercase tracking-wider">Helpful Shortcuts</h4>
            <ul className="space-y-2 text-sm text-foreground/60">
              <li>
                <Link href="/" className="hover:text-primary hover:underline transition-colors font-medium">Browse Groceries</Link>
              </li>
              <li>
                <Link href="/profile" className="hover:text-primary hover:underline transition-colors font-medium">Track My Order</Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-primary hover:underline transition-colors font-medium">Shop Management Dashboard</Link>
              </li>
              <li className="text-xs text-foreground/40 mt-4 leading-relaxed border-t border-border-color/50 pt-2">
                SMS Grocery is Vercel Ready and PWA compatible.
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-border-color/50 pt-6 text-center text-xs text-foreground/40">
          <p>© {new Date().getFullYear()} SMS Grocery Shop. All rights reserved. Sourced & Operated in Thanjavur, Tamil Nadu.</p>
        </div>
      </div>
    </footer>
  );
}
