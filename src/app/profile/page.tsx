'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/shared/Header';
import Footer from '@/components/shared/Footer';
import CartDrawer from '@/components/customer/CartDrawer';
import WhatsAppButton from '@/components/shared/WhatsAppButton';
import { useApp } from '@/lib/context/AppContext';
import { User, MapPin, Calendar, Clock, ShoppingBag, Gift, ArrowRight, Award, Compass, CreditCard } from 'lucide-react';

interface Order {
  id: string;
  customerName: string;
  customerMobile: string;
  customerAddress: string;
  pickupTime: string;
  totalAmount: number;
  tax: number;
  discount: number;
  status: 'PENDING' | 'ACCEPTED' | 'PACKING' | 'READY_FOR_PICKUP' | 'COMPLETED' | 'CANCELLED';
  paymentStatus: 'PENDING' | 'COMPLETED';
  createdAt: string;
  items: { quantity: number; productName: string }[];
}

export default function Profile() {
  const router = useRouter();
  const { user, logout } = useApp();
  const [orders, setOrders] = useState<Order[]>([]);
  const [customerInfo, setCustomerInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    async function loadCustomerData() {
      try {
        // Fetch customer orders
        const ordersRes = await fetch('/api/orders');
        const ordersData = await ordersRes.json();
        if (ordersRes.ok) {
          setOrders(ordersData);
        }

        // Fetch customer loyalty/spend stats
        const infoRes = await fetch('/api/customers'); // standard list returns all, but we find our info
        if (infoRes.ok) {
          const allCust = await infoRes.json();
          const me = allCust.find((c: any) => c.mobileNumber === user?.mobile);
          if (me) {
            setCustomerInfo(me);
          }
        }
      } catch (e) {
        console.error('Failed to load profile details:', e);
      } finally {
        setLoading(false);
      }
    }

    loadCustomerData();
  }, [user]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400';
      case 'ACCEPTED': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
      case 'PACKING': return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400';
      case 'READY_FOR_PICKUP': return 'bg-purple-500/10 text-purple-600 dark:text-purple-400';
      case 'COMPLETED': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
      case 'CANCELLED': return 'bg-red-500/10 text-red-600 dark:text-red-400';
      default: return 'bg-foreground/5 text-foreground/60';
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground transition-colors">
      <Suspense fallback={<div className="h-16 border-b border-border-color bg-card-bg" />}>
        <Header onCartToggle={() => setIsCartOpen(true)} />
      </Suspense>

      <main className="flex-1 mx-auto max-w-5xl w-full px-4 py-8 sm:px-6 lg:px-8">
        
        {!user ? (
          /* Not Logged In View */
          <div className="mx-auto max-w-md text-center py-20 px-6 bg-card-bg border border-border-color rounded-2xl shadow-xs">
            <User className="h-20 w-20 text-foreground/20 stroke-1 mx-auto mb-4" />
            <h2 className="text-xl font-black text-foreground">Sign In to View History</h2>
            <p className="text-sm text-foreground/50 mt-1 max-w-[280px] mx-auto">
              Please log in with your mobile number to view your past purchases and track active bills.
            </p>
            <button
              onClick={() => router.push('/login')}
              className="mt-6 rounded-xl bg-primary px-8 py-3 text-sm font-black text-white hover:bg-primary-hover shadow-md transition-all cursor-pointer"
            >
              Verify Mobile Number
            </button>
          </div>
        ) : (
          /* Logged In View */
          <div className="space-y-8 animate-fade-in">
            {/* Profile Overview Card */}
            <div className="relative overflow-hidden rounded-2xl border border-border-color bg-card-bg p-6 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-extrabold text-2xl uppercase">
                  {user.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-black text-foreground flex items-center gap-2">
                    {user.name}
                    {user.role === 'ADMIN' && (
                      <span className="rounded bg-red-500/10 px-2 py-0.5 text-[10px] font-black text-red-500 uppercase tracking-widest">
                        Owner
                      </span>
                    )}
                  </h2>
                  <p className="text-xs text-foreground/45 font-semibold font-mono mt-0.5">Mobile: +91 {user.mobile}</p>
                </div>
              </div>

              {/* Loyalty & Spend Statistics Panel */}
              <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
                <div className="rounded-xl border border-border-color bg-background/50 p-3.5 flex items-center gap-3">
                  <Award className="h-8 w-8 text-primary shrink-0" />
                  <div>
                    <span className="block text-[10px] font-bold text-foreground/45 uppercase tracking-wider">Loyalty Points</span>
                    <span className="text-lg font-black text-foreground">{customerInfo?.loyaltyPoints || 0} Points</span>
                  </div>
                </div>

                <div className="rounded-xl border border-border-color bg-background/50 p-3.5 flex items-center gap-3">
                  <Gift className="h-8 w-8 text-primary shrink-0" />
                  <div>
                    <span className="block text-[10px] font-bold text-foreground/45 uppercase tracking-wider">Total Purchases</span>
                    <span className="text-lg font-black text-foreground">₹{customerInfo?.totalSpend || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Main History section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Address card left */}
              <div className="space-y-6">
                <div className="rounded-2xl border border-border-color bg-card-bg p-5 shadow-xs">
                  <h3 className="text-sm font-black text-foreground border-b border-border-color/50 pb-2 uppercase tracking-wider flex items-center gap-1.5 mb-4">
                    <MapPin className="h-4.5 w-4.5 text-primary" />
                    Saved Details
                  </h3>
                  
                  <div className="space-y-3 text-sm text-foreground/80 leading-relaxed font-semibold">
                    <p className="text-xs font-bold text-foreground/45 uppercase tracking-wider">Default Address</p>
                    <p className="text-foreground/75 leading-relaxed">
                      {customerInfo?.address || (user.mobile === '9788045564' 
                        ? '818, Tendral Nagar, Vennar Bank Post, Manakarambai, Thanjavur' 
                        : 'No saved address. Place an order to save your address!')}
                    </p>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="mt-6 w-full rounded-xl border border-red-500/20 py-2.5 text-xs font-bold text-red-500 hover:bg-red-500/5 transition-colors cursor-pointer"
                  >
                    Logout Account
                  </button>
                </div>
              </div>

              {/* Order history list right */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-lg font-black text-foreground flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                  Purchase History ({orders.length})
                </h3>

                {loading ? (
                  <div className="flex flex-col items-center justify-center py-10 bg-card-bg rounded-2xl border border-border-color">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="mt-2 text-xs text-foreground/50 font-bold">Loading past orders...</p>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-16 border border-dashed border-border-color rounded-2xl bg-card-bg">
                    <p className="text-sm text-foreground/50 font-bold">You have no order history yet.</p>
                    <p className="text-xs text-foreground/40 mt-1 max-w-xs mx-auto">
                      Go back to the homepage, add items to your cart, and place your first order!
                    </p>
                    <button
                      onClick={() => router.push('/')}
                      className="mt-4 rounded-lg bg-primary px-5 py-2 text-xs font-bold text-white hover:bg-primary-hover shadow"
                    >
                      Start Shopping
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div 
                        key={order.id}
                        className="rounded-2xl border border-border-color bg-card-bg p-5 shadow-xs space-y-4 hover:border-foreground/15 transition-all"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-color/30 pb-3">
                          <div>
                            <span className="text-[10px] text-foreground/45 font-bold uppercase tracking-wider block">Order ID</span>
                            <span className="font-mono font-black text-foreground select-all">{order.id}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${getStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                            <span className="text-xs text-foreground/40 font-semibold flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {new Date(order.createdAt).toLocaleDateString('en-IN')}
                            </span>
                          </div>
                        </div>

                        {/* Items preview details */}
                        <div className="flex justify-between items-center gap-4">
                          <div className="text-sm text-foreground/75 font-semibold">
                            <span className="block text-xs font-bold text-foreground/40 uppercase tracking-wider">Items Summary</span>
                            <p className="line-clamp-1 mt-0.5">
                              {order.items.map(item => `${item.productName} (x${item.quantity})`).join(', ')}
                            </p>
                          </div>
                          
                          <div className="text-right shrink-0">
                            <span className="block text-xs font-bold text-foreground/45 uppercase tracking-wider">Grand Total</span>
                            <span className="text-base font-black text-foreground">₹{order.totalAmount}</span>
                          </div>
                        </div>

                        {/* Actions link to tracking */}
                        <div className="flex justify-between items-center border-t border-border-color/30 pt-3 text-xs">
                          <span className="text-foreground/45 font-bold">
                            Fulfillment: {order.pickupTime}
                          </span>
                          <button
                            onClick={() => router.push(`/order/${order.id}`)}
                            className="flex items-center gap-1 text-primary hover:underline font-black cursor-pointer"
                          >
                            Track & Receipt
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

      </main>

      <Footer />
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <WhatsAppButton />
    </div>
  );
}
