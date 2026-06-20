'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '@/lib/context/AppContext';
import { Search, ShoppingBag, Sun, Moon, User, LogOut, ShieldAlert, Store } from 'lucide-react';

interface HeaderProps {
  onCartToggle?: () => void;
}

export default function Header({ onCartToggle }: HeaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme, toggleTheme, cart, user, logout } = useApp();
  
  const [searchQuery, setSearchQuery] = useState(searchParams?.get('q') || '');
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const cartItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartSubtotal = cart.reduce((acc, item) => acc + (item.product.sellingPrice * item.quantity), 0);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/');
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b border-border-color bg-card-bg/95 backdrop-blur-md transition-colors no-print">
      <div className="mx-auto flex max-w-7xl h-16 items-center justify-between px-4 sm:px-6 lg:px-8 gap-4">
        
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 group shrink-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white font-extrabold text-xl shadow-md group-hover:scale-105 transition-transform">
            S
          </div>
          <div className="hidden sm:block">
            <span className="text-lg font-black text-primary tracking-tight leading-none">SMS</span>
            <span className="block text-xs font-bold text-foreground/50 tracking-wider">GROCERY SHOP</span>
          </div>
        </Link>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md mx-2 md:mx-6">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for apples, milk, biscuits, soaps..."
              className="w-full rounded-full border border-border-color bg-background/60 py-2 pl-4 pr-10 text-sm text-foreground placeholder-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
            <button 
              type="submit" 
              className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-foreground/40 hover:text-primary transition-colors cursor-pointer"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>
        </form>

        {/* Actions Menu */}
        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="rounded-full p-2 text-foreground/75 hover:bg-foreground/5 hover:text-foreground transition-colors cursor-pointer"
            title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          {/* User Section */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-1.5 rounded-full border border-border-color bg-background/50 px-3 py-1.5 text-sm font-semibold text-foreground hover:bg-foreground/5 transition-colors cursor-pointer"
              >
                <User className="h-4 w-4 text-primary" />
                <span className="max-w-[80px] sm:max-w-[120px] truncate">{user.name.split(' ')[0]}</span>
              </button>

              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl border border-border-color bg-card-bg p-1 shadow-lg animate-scale-in">
                  {user.role === 'ADMIN' && (
                    <Link
                      href="/admin"
                      onClick={() => setShowDropdown(false)}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-bold text-primary hover:bg-primary/10 transition-colors"
                    >
                      <ShieldAlert className="h-4 w-4" />
                      Dashboard
                    </Link>
                  )}
                  <Link
                    href="/profile"
                    onClick={() => setShowDropdown(false)}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-foreground/80 hover:bg-foreground/5 transition-colors"
                  >
                    <Store className="h-4 w-4" />
                    My History
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setShowDropdown(false);
                      router.push('/');
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-bold text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => router.push('/login')}
              className="flex items-center gap-1.5 rounded-full bg-foreground text-background px-4 py-2 text-xs md:text-sm font-bold hover:opacity-90 active:scale-95 transition-all cursor-pointer"
            >
              <User className="h-4 w-4" />
              Login
            </button>
          )}

          {/* Cart Button */}
          {onCartToggle && (
            <button
              onClick={onCartToggle}
              className="flex items-center gap-2 rounded-full bg-primary px-3.5 sm:px-4 py-2 text-xs md:text-sm font-extrabold text-white shadow-md hover:bg-primary-hover active:scale-95 transition-all cursor-pointer"
            >
              <ShoppingBag className="h-4.5 w-4.5 shrink-0" />
              <span className="hidden sm:inline">
                {cartItemsCount > 0 ? `${cartItemsCount} Items` : 'Cart'}
              </span>
              {cartItemsCount > 0 && (
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-black">
                  ₹{cartSubtotal}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

    </header>
  );
}
