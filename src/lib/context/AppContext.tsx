'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { customersService } from '@/lib/services/customers';

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

    // Auth state synchronized via Firebase Auth
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const email = firebaseUser.email;
        const phoneNumber = firebaseUser.phoneNumber;
        
        let role: 'ADMIN' | 'CUSTOMER' = 'CUSTOMER';
        let name = 'Valued Customer';
        let mobile = '';
        
        if (email && email === 'admin@smsgrocery.com') {
          role = 'ADMIN';
          name = 'Mohammad Ali Jinnah (Owner)';
          mobile = '9788045564';
        } else if (phoneNumber) {
          role = 'CUSTOMER';
          mobile = phoneNumber.replace(/\D/g, '');
          if (mobile.startsWith('91') && mobile.length > 10) {
            mobile = mobile.substring(2);
          }
          try {
            const profile = await customersService.getCustomerByMobile(mobile);
            if (profile) {
              name = profile.name;
            }
          } catch (e) {
            console.error("Failed to load customer profile during auth sync:", e);
          }
        }
        
        const session = {
          mobile,
          name,
          role,
          token: firebaseUser.uid
        };
        
        setUser(session);
        localStorage.setItem('sms-user', JSON.stringify(session));
        document.cookie = `sms_session=${btoa(JSON.stringify(session))}; path=/; max-age=604800; SameSite=Lax`;
      } else {
        setUser(null);
        localStorage.removeItem('sms-user');
        document.cookie = 'sms_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      }
    });

    return () => unsubscribe();
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
    // Session state is set by the onAuthStateChanged listener automatically
    setUser(session);
    localStorage.setItem('sms-user', JSON.stringify(session));
    document.cookie = `sms_session=${btoa(JSON.stringify(session))}; path=/; max-age=604800; SameSite=Lax`;
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error('Firebase signout error:', e);
    }
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
