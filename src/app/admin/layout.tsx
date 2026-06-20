'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '@/lib/context/AppContext';
import { 
  LayoutDashboard, ShoppingCart, Package, ListPlus, Users, Truck, BarChart3, 
  ArrowLeft, LogOut, Sun, Moon, BellRing, Lock, AlertTriangle, ShieldCheck
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, theme, toggleTheme, logout } = useApp();
  
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<any>({ lowStock: 0, outOfStock: 0, expiring: 0 });

  // Load alert counts for notifications badge in sidebar
  useEffect(() => {
    async function loadAlertCounts() {
      if (user?.role !== 'ADMIN') return;
      try {
        const res = await fetch('/api/reports');
        if (res.ok) {
          const data = await res.json();
          setAlerts({
            lowStock: data.alerts.lowStock.length,
            outOfStock: data.alerts.outOfStock.length,
            expiring: data.alerts.expiringSoon.length
          });
        }
      } catch (e) {}
    }

    loadAlertCounts();
    setLoading(false);
  }, [user]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Security Check: Enforce that Customers NEVER access internal metrics
  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#090d16] p-4 text-white">
        <div className="w-full max-w-md rounded-2xl border border-red-500/20 bg-[#111a2e] p-8 text-center shadow-2xl space-y-6">
          <Lock className="h-16 w-16 text-red-500 mx-auto animate-pulse" />
          <div>
            <h2 className="text-2xl font-black tracking-tight text-white">Owner Access Restricted</h2>
            <p className="text-sm text-slate-400 mt-2">
              This area contains sensitive business reports, profit analytics, and cost catalogs. Customers are strictly prohibited.
            </p>
          </div>

          <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-xs text-red-400 font-semibold leading-relaxed">
            <strong>Security Rule:</strong> Customers must never see purchase costs, supplier margins, or profit indices.
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => router.push('/')}
              className="flex-1 rounded-xl bg-slate-800 py-3 text-xs font-bold text-white hover:bg-slate-700 transition-all cursor-pointer"
            >
              Back to Store
            </button>
            <button
              onClick={() => {
                logout();
                router.push('/admin/login');
              }}
              className="flex-1 rounded-xl bg-primary py-3 text-xs font-bold text-white hover:bg-primary-hover shadow-md transition-all cursor-pointer"
            >
              Admin Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  const menuItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Billing & POS', path: '/admin/billing', icon: ShoppingCart },
    { name: 'Active Orders', path: '/admin/orders', icon: Truck },
    { name: 'Products Catalog', path: '/admin/products', icon: ListPlus },
    { name: 'Inventory Logs', path: '/admin/inventory', icon: Package },
    { name: 'Supplier Register', path: '/admin/suppliers', icon: Users },
    { name: 'Customer Directory', path: '/admin/customers', icon: ShieldCheck },
    { name: 'Profit & Reports', path: '/admin/reports', icon: BarChart3 }
  ];

  const totalAlertsCount = alerts.lowStock + alerts.outOfStock + alerts.expiring;

  return (
    <div className="min-h-screen flex bg-background text-foreground transition-colors">
      
      {/* Sidebar - Hidden on print */}
      <aside className="w-64 border-r border-border-color bg-card-bg flex flex-col shrink-0 no-print transition-colors">
        {/* Brand */}
        <div className="h-16 flex items-center px-6 border-b border-border-color/70 gap-2 shrink-0">
          <div className="h-8 w-8 rounded-lg bg-primary text-white flex items-center justify-center font-extrabold text-sm">
            SMS
          </div>
          <div>
            <span className="text-sm font-black text-foreground tracking-tight block">Owner Panel</span>
            <span className="text-[10px] text-foreground/45 font-bold tracking-wider uppercase block">SMS Grocery Shop</span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto no-scrollbar">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            const isInventory = item.name === 'Inventory Logs';
            
            return (
              <Link
                key={item.name}
                href={item.path}
                className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-bold transition-all ${
                  isActive
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-foreground/75 hover:bg-foreground/5 hover:text-foreground'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4.5 w-4.5" />
                  <span>{item.name}</span>
                </div>
                {isInventory && totalAlertsCount > 0 && (
                  <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-black text-white flex items-center justify-center animate-pulse">
                    {totalAlertsCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-border-color/70 shrink-0 space-y-2 text-xs font-semibold text-foreground/60">
          <div className="flex items-center justify-between px-2">
            <span>Theme Toggle:</span>
            <button
              onClick={toggleTheme}
              className="p-1 rounded-lg hover:bg-foreground/5 text-foreground/80 cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>

          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg px-2 py-2 text-left hover:bg-foreground/5 text-foreground/75 hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4 text-primary" />
            <span>Storefront Portal</span>
          </Link>

          <button
            onClick={() => {
              logout();
              router.push('/');
            }}
            className="w-full flex items-center gap-2 rounded-lg px-2 py-2 text-left text-red-500 hover:bg-red-500/5 transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout Account</span>
          </button>
        </div>
      </aside>

      {/* Main Workspace Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-background/50 overflow-hidden">
        
        {/* Admin Top Navbar - Hidden on print */}
        <header className="h-16 border-b border-border-color bg-card-bg px-6 flex items-center justify-between shrink-0 no-print transition-colors">
          <h2 className="text-base font-black text-foreground">
            Welcome, Mohammad Ali Jinnah
          </h2>

          <div className="flex items-center gap-4">
            {/* Quick alert notifications widget */}
            {totalAlertsCount > 0 ? (
              <div className="flex items-center gap-1.5 rounded-lg bg-red-500/10 border border-red-500/15 px-3 py-1.5 text-xs text-red-500 font-bold">
                <BellRing className="h-4 w-4 animate-swing" />
                <span>{totalAlertsCount} Urgent Alerts</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/15 px-3 py-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                <ShieldCheck className="h-4 w-4" />
                <span>Inventory Safe</span>
              </div>
            )}
          </div>
        </header>

        {/* View Content Workspace */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 no-scrollbar bg-background/25">
          {children}
        </main>
      </div>
    </div>
  );
}
