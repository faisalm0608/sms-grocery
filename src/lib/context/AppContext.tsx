'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

// Product structure matching prisma/localDb
export interface Product {
  id: string;
  barcode: string;
  name: string;
  image: string;
  description: string;
  category: string;
  purchasePrice: number;
  sellingPrice: number;
  stockQuantity: number;
  reorderLevel: number;
  supplierName: string;
  expiryDate?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface UserSession {
  mobile: string;
  name: string;
  role: 'ADMIN' | 'CUSTOMER';
  token: string;
}

interface AppContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  cart: CartItem[];
  addToCart: (product: Product, qty?: number) => void;
  updateCartQuantity: (productId: string, qty: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  user: UserSession | null;
  login: (session: UserSession) => void;
  logout: () => void;
  notifications: string[];
  addNotification: (message: string) => void;
  clearNotifications: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [user, setUser] = useState<UserSession | null>(null);
  const [notifications, setNotifications] = useState<string[]>([]);

  // Load state from localStorage on mount
  useEffect(() => {
    // Theme
    const storedTheme = localStorage.getItem('sms-theme') as 'light' | 'dark';
    if (storedTheme) {
      setTheme(storedTheme);
      document.documentElement.classList.toggle('dark', storedTheme === 'dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', prefersDark);
    }

    // Cart
    const storedCart = localStorage.getItem('sms-cart');
    if (storedCart) {
      try {
        setCart(JSON.parse(storedCart));
      } catch (e) {
        console.error('Failed to parse stored cart:', e);
      }
    }

    // Auth
    const storedUser = localStorage.getItem('sms-user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Failed to parse stored user:', e);
      }
    }
  }, []);

  // Sync Theme updates
  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('sms-theme', nextTheme);
    document.documentElement.classList.toggle('dark', nextTheme === 'dark');
  };

  // Sync Cart to localStorage on change
  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart);
    localStorage.setItem('sms-cart', JSON.stringify(newCart));
  };

  const addToCart = (product: Product, qty = 1) => {
    const existingIndex = cart.findIndex(item => item.product.id === product.id);
    if (existingIndex > -1) {
      const newCart = [...cart];
      // Limit to stock quantity
      const newQty = newCart[existingIndex].quantity + qty;
      newCart[existingIndex].quantity = Math.min(newQty, product.stockQuantity);
      saveCart(newCart);
    } else {
      saveCart([...cart, { product, quantity: Math.min(qty, product.stockQuantity) }]);
    }
  };

  const updateCartQuantity = (productId: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(productId);
      return;
    }
    const newCart = cart.map(item => {
      if (item.product.id === productId) {
        return { ...item, quantity: Math.min(qty, item.product.stockQuantity) };
      }
      return item;
    });
    saveCart(newCart);
  };

  const removeFromCart = (productId: string) => {
    const newCart = cart.filter(item => item.product.id !== productId);
    saveCart(newCart);
  };

  const clearCart = () => {
    saveCart([]);
  };

  // Auth management
  const login = (session: UserSession) => {
    setUser(session);
    localStorage.setItem('sms-user', JSON.stringify(session));
    // Set custom session cookie for API routes if needed
    document.cookie = `sms_session=${session.token}; path=/; max-age=604800; SameSite=Lax`;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('sms-user');
    document.cookie = 'sms_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  };

  // Notification triggers
  const addNotification = (message: string) => {
    setNotifications(prev => [message, ...prev.slice(0, 19)]);
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  return (
    <AppContext.Provider value={{
      theme,
      toggleTheme,
      cart,
      addToCart,
      updateCartQuantity,
      removeFromCart,
      clearCart,
      user,
      login,
      logout,
      notifications,
      addNotification,
      clearNotifications
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
