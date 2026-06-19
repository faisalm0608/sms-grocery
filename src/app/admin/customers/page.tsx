'use client';

import React, { useState, useEffect } from 'react';
import { Search, Award, Gift, Sparkles, User, Calendar, Phone } from 'lucide-react';

interface Customer {
  mobileNumber: string;
  name: string;
  address?: string;
  totalSpend: number;
  loyaltyPoints: number;
  createdAt: string;
  updatedAt: string;
}

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadCustomers() {
      try {
        const res = await fetch('/api/customers');
        if (res.ok) {
          const data = await res.json();
          setCustomers(data);
        }
      } catch (e) {
        setError('Failed to fetch customer directory records.');
      } finally {
        setLoading(false);
      }
    }
    loadCustomers();
  }, []);

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.mobileNumber.includes(searchQuery) ||
    (c.address && c.address.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-black text-foreground tracking-tight">Customer Directory</h1>
        <p className="text-sm text-foreground/50 mt-1">Audit customer loyalty metrics, track lifetime purchases value (LTV), and review locations.</p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 p-3.5 text-xs font-bold text-red-500 border border-red-500/20">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="relative max-w-md w-full">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search customers by name, phone, or address..."
          className="w-full rounded-xl border border-border-color bg-card-bg py-2.5 pl-10 pr-4 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-semibold"
        />
        <Search className="absolute left-3.5 top-3 h-4 w-4 text-foreground/45" />
      </div>

      {/* Grid: LTV leaderboard overview stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="rounded-2xl border border-border-color bg-card-bg p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-foreground/45 uppercase tracking-wider block">Registered Members</span>
            <h3 className="text-2xl font-black text-foreground">{customers.length}</h3>
          </div>
          <div className="h-11 w-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <User className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-2xl border border-border-color bg-card-bg p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-foreground/45 uppercase tracking-wider block">Average Spend (LTV)</span>
            <h3 className="text-2xl font-black text-foreground">
              ₹{customers.length > 0 
                ? Math.round((customers.reduce((a, c) => a + c.totalSpend, 0) / customers.length) * 100) / 100 
                : 0}
            </h3>
          </div>
          <div className="h-11 w-11 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Gift className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-2xl border border-border-color bg-card-bg p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-foreground/45 uppercase tracking-wider block">Total Loyalty Disbursed</span>
            <h3 className="text-2xl font-black text-foreground">
              {customers.reduce((a, c) => a + c.loyaltyPoints, 0)} Points
            </h3>
          </div>
          <div className="h-11 w-11 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Award className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Table directories */}
      <div className="rounded-2xl border border-border-color bg-card-bg shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-foreground/5 text-xs font-bold text-foreground/60 uppercase">
                <th className="p-3">Customer Name</th>
                <th className="p-3">Verified Contact</th>
                <th className="p-3">Billing Address</th>
                <th className="p-3 text-center">Loyalty Balance</th>
                <th className="p-3 text-center">Total Spend (LTV)</th>
                <th className="p-3 text-right">Registration Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-color font-semibold">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center">
                    <div className="h-5 w-5 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-foreground/40 font-bold">
                    No customers found matching queries.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map(c => (
                  <tr key={c.mobileNumber} className="hover:bg-foreground/2">
                    <td className="p-3 flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-full bg-foreground/5 text-foreground/75 flex items-center justify-center font-bold">
                        {c.name.charAt(0)}
                      </div>
                      <div>
                        <span className="font-bold text-foreground block">{c.name}</span>
                        {c.totalSpend > 3000 && (
                          <span className="inline-flex items-center gap-0.5 rounded bg-yellow-500/10 px-1 py-0.5 text-[8px] font-black text-yellow-600 dark:text-yellow-400 uppercase tracking-widest mt-0.5">
                            <Sparkles className="h-2 w-2" />
                            Premium VIP
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 font-mono font-bold text-foreground/75">
                      <span className="flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5 text-primary shrink-0" />
                        +91 {c.mobileNumber}
                      </span>
                    </td>
                    <td className="p-3 text-foreground/60 max-w-xs truncate">
                      {c.address || 'In-store Walk-in client'}
                    </td>
                    <td className="p-3 text-center font-bold text-purple-600 dark:text-purple-400">
                      {c.loyaltyPoints} Points
                    </td>
                    <td className="p-3 text-center font-black text-foreground">
                      ₹{c.totalSpend}
                    </td>
                    <td className="p-3 text-right text-foreground/45 flex items-center justify-end gap-1 mt-3.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(c.createdAt).toLocaleDateString('en-IN')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
