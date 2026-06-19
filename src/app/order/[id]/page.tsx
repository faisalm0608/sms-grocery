'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Header from '@/components/shared/Header';
import Footer from '@/components/shared/Footer';
import WhatsAppButton from '@/components/shared/WhatsAppButton';
import { Phone, MessageSquare, Printer, CheckCircle, Package, ShoppingBag, Truck, Calendar, Sparkles } from 'lucide-react';

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  purchasePrice: number;
  sellingPrice: number;
}

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
  upiTxnId?: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

export default function OrderTracking({ params }: { params: any }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Real-time polling
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    async function resolveParams() {
      const resolved = await params;
      setOrderId(resolved.id);
    }
    resolveParams();
  }, [params]);

  useEffect(() => {
    if (!orderId) return;

    async function loadOrder() {
      try {
        const res = await fetch(`/api/orders/${orderId}`);
        const data = await res.json();
        if (res.ok) {
          setOrder(data);
        } else {
          setError(data.message || 'Order not found');
        }
      } catch (e) {
        setError('Failed to fetch order tracking details.');
      } finally {
        setLoading(false);
      }
    }
    
    loadOrder();

    // Poll every 10 seconds to get status updates from the owner dashboard
    const interval = setInterval(loadOrder, 10000);
    return () => clearInterval(interval);
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <div className="flex flex-1 flex-col items-center justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-4 text-sm text-foreground/50 font-bold">Retrieving tracking information...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <div className="mx-auto max-w-md flex flex-1 flex-col items-center justify-center py-20 text-center px-4">
          <h2 className="text-xl font-black text-foreground">Order Not Found</h2>
          <p className="text-sm text-foreground/50 mt-1">
            We couldn't locate any order with ID: <strong className="font-mono text-primary">{orderId}</strong>
          </p>
          <Link
            href="/"
            className="mt-6 rounded-xl bg-primary px-6 py-2.5 text-xs font-bold text-white hover:bg-primary-hover shadow"
          >
            Go Back Home
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  // Define tracking status index mapping
  const statusSteps = [
    { key: 'PENDING', label: 'Order Received', desc: 'Awaiting shop review', icon: ShoppingBag },
    { key: 'ACCEPTED', label: 'Accepted', desc: 'Confirmed by shop owner', icon: CheckCircle },
    { key: 'PACKING', label: 'Packing Items', desc: 'Preparing fresh items', icon: Package },
    { key: 'READY_FOR_PICKUP', label: 'Ready for Pickup', desc: 'Ready for collection/transit', icon: Truck },
    { key: 'COMPLETED', label: 'Order Completed', desc: 'Thank you for shopping!', icon: Sparkles }
  ];

  const getStatusIndex = (currentStatus: string) => {
    if (currentStatus === 'CANCELLED') return -1;
    return statusSteps.findIndex(step => step.key === currentStatus);
  };

  const currentStepIndex = getStatusIndex(order.status);

  const handlePrint = () => {
    window.print();
  };

  // WhatsApp template query
  const whatsappUrl = `https://wa.me/919788045564?text=${encodeURIComponent(
    `Hi SMS Grocery, I am checking status of my order ID: ${order.id}. Current status is: ${order.status}.`
  )}`;

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground transition-colors">
      <Suspense fallback={<div className="h-16 border-b border-border-color bg-card-bg" />}>
        <Header />
      </Suspense>

      <main className="flex-1 mx-auto max-w-4xl w-full px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        
        {/* Order Success Flash Notification */}
        {order.status === 'PENDING' && (
          <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/15 p-4 flex items-center justify-between no-print animate-fade-in">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-primary shrink-0" />
              <div>
                <h3 className="text-sm font-black text-foreground">Order Placed Successfully!</h3>
                <p className="text-xs text-foreground/50 leading-relaxed mt-0.5">
                  Your order is pending acceptance. Keep this page open to track real-time packing status.
                </p>
              </div>
            </div>
            <button
              onClick={handlePrint}
              className="hidden sm:flex items-center gap-1 text-xs font-bold bg-primary text-white rounded-lg px-3.5 py-2 hover:bg-primary-hover shadow-xs cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              Print Receipt
            </button>
          </div>
        )}

        {/* Cancelled Flash */}
        {order.status === 'CANCELLED' && (
          <div className="rounded-2xl bg-red-500/10 border border-red-500/15 p-4 flex items-center gap-3 no-print animate-fade-in">
            <div className="h-8 w-8 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center shrink-0 font-bold text-lg">!</div>
            <div>
              <h3 className="text-sm font-black text-red-500">Order Cancelled</h3>
              <p className="text-xs text-foreground/50 mt-0.5">
                This order was marked as cancelled. Any payment verification can be clarified by contacting the owner.
              </p>
            </div>
          </div>
        )}

        {/* Visual Progress Steps Tracker */}
        {order.status !== 'CANCELLED' && (
          <div className="rounded-2xl border border-border-color bg-card-bg p-6 shadow-xs no-print">
            <h3 className="text-base font-black text-foreground border-b border-border-color/50 pb-3 mb-6">
              Fulfillment Timeline
            </h3>

            {/* Horizontal Timeline (Desktop) */}
            <div className="hidden md:flex items-start justify-between relative">
              {/* Connecting line */}
              <div className="absolute top-5 left-[10%] right-[10%] h-0.5 bg-border-color z-0" />
              {/* Completed highlight line */}
              {currentStepIndex > 0 && (
                <div 
                  className="absolute top-5 left-[10%] h-0.5 bg-primary z-0 transition-all duration-500" 
                  style={{ width: `${(currentStepIndex / 4) * 80}%` }}
                />
              )}

              {statusSteps.map((step, idx) => {
                const StepIcon = step.icon;
                const isCompleted = idx <= currentStepIndex;
                const isActive = idx === currentStepIndex;

                return (
                  <div key={step.key} className="flex flex-col items-center text-center z-10 w-[20%]">
                    <div 
                      className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                        isCompleted 
                          ? 'bg-primary text-white border-primary shadow-sm scale-110' 
                          : 'bg-card-bg text-foreground/30 border-border-color'
                      }`}
                    >
                      <StepIcon className="h-5 w-5" />
                    </div>
                    <h4 className={`text-xs font-black mt-3 leading-none ${isActive ? 'text-primary' : 'text-foreground/75'}`}>
                      {step.label}
                    </h4>
                    <span className="text-[10px] text-foreground/45 mt-1 leading-tight font-semibold max-w-[100px] block">
                      {step.desc}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Vertical Timeline (Mobile) */}
            <div className="md:hidden space-y-6 relative pl-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border-color">
              {statusSteps.map((step, idx) => {
                const StepIcon = step.icon;
                const isCompleted = idx <= currentStepIndex;
                const isActive = idx === currentStepIndex;

                return (
                  <div key={step.key} className="relative flex gap-4">
                    <div 
                      className={`absolute -left-6 z-10 flex h-6 w-6 items-center justify-center rounded-full border transition-all ${
                        isCompleted 
                          ? 'bg-primary text-white border-primary shadow-xs' 
                          : 'bg-card-bg text-foreground/30 border-border-color'
                      }`}
                    >
                      <StepIcon className="h-3 w-3" />
                    </div>
                    <div>
                      <h4 className={`text-xs font-black leading-tight ${isActive ? 'text-primary' : 'text-foreground/80'}`}>
                        {step.label}
                      </h4>
                      <p className="text-[10px] text-foreground/50 leading-snug mt-0.5">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* printable receipt detail */}
        <div className="rounded-2xl border border-border-color bg-card-bg p-6 shadow-xs print-card space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start border-b border-border-color/50 pb-5 gap-4">
            <div>
              <span className="text-xs font-black text-primary tracking-widest uppercase">Invoice Receipt</span>
              <h2 className="text-lg font-black text-foreground mt-0.5 font-mono select-all">Order ID: {order.id}</h2>
              <div className="flex items-center gap-1.5 text-xs text-foreground/45 mt-1 font-semibold">
                <Calendar className="h-3.5 w-3.5" />
                <span>Date: {new Date(order.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</span>
              </div>
            </div>

            {/* Support button floats print-hidden */}
            <div className="flex gap-2 w-full sm:w-auto no-print">
              <a
                href="tel:+919788045564"
                className="flex-1 sm:flex-none flex items-center justify-center gap-1 bg-foreground/5 text-foreground hover:bg-foreground/10 px-4 py-2 rounded-xl text-xs font-bold transition-all"
              >
                <Phone className="h-3.5 w-3.5" />
                Call Shop
              </a>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-none flex items-center justify-center gap-1 bg-emerald-500 text-white hover:bg-emerald-600 px-4 py-2 rounded-xl text-xs font-bold transition-all"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                WhatsApp Inquiry
              </a>
              <button
                onClick={handlePrint}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1 bg-primary text-white hover:bg-primary-hover px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5" />
                Print
              </button>
            </div>
          </div>

          {/* Customer & Shop Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-foreground/45 uppercase tracking-wider">Customer Details</h4>
              <p className="font-extrabold text-foreground">{order.customerName}</p>
              <p className="text-foreground/75 font-semibold font-mono">Mobile: +91 {order.customerMobile}</p>
              <p className="text-foreground/60 leading-relaxed font-semibold">
                Address: {order.customerAddress}
              </p>
            </div>

            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-foreground/45 uppercase tracking-wider">Shop & Fulfillment</h4>
              <p className="font-extrabold text-foreground">SMS Grocery Shop</p>
              <p className="text-foreground/75 font-semibold">Fulfillment: {order.pickupTime}</p>
              <p className="text-foreground/60 font-semibold leading-relaxed">
                UPI Reference: <span className="font-mono text-xs select-all text-foreground/80">{order.upiTxnId || 'N/A'}</span>
              </p>
              <div className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                Payment: {order.paymentStatus}
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto border border-border-color rounded-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-foreground/5 text-xs font-bold text-foreground/70 uppercase">
                  <th className="p-3">Product Item</th>
                  <th className="p-3 text-center">Unit Price</th>
                  <th className="p-3 text-center">Qty</th>
                  <th className="p-3 text-right">Total Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-color text-sm">
                {order.items.map((item) => (
                  <tr key={item.id} className="hover:bg-foreground/2">
                    <td className="p-3 font-bold text-foreground">{item.productName}</td>
                    <td className="p-3 text-center font-semibold">₹{item.sellingPrice}</td>
                    <td className="p-3 text-center font-bold">{item.quantity}</td>
                    <td className="p-3 text-right font-black">₹{item.sellingPrice * item.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pricing receipt sum */}
          <div className="flex justify-end pt-3">
            <div className="w-64 space-y-2 text-sm border-t border-border-color/50 pt-3">
              <div className="flex justify-between text-foreground/60">
                <span>Subtotal:</span>
                <span className="font-bold">₹{order.totalAmount + order.discount - order.tax}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-primary font-bold">
                  <span>Store Discount (5%):</span>
                  <span>-₹{order.discount}</span>
                </div>
              )}
              <div className="flex justify-between text-foreground/60">
                <span>GST Tax (5%):</span>
                <span className="font-bold">₹{order.tax}</span>
              </div>
              <div className="flex justify-between text-base font-black text-foreground border-t border-border-color/50 pt-2">
                <span>Grand Total:</span>
                <span>₹{order.totalAmount}</span>
              </div>
            </div>
          </div>

          {/* Footer terms */}
          <div className="border-t border-border-color/30 pt-6 text-center text-[10px] text-foreground/40 leading-relaxed font-semibold">
            <p>Thank you for choosing SMS Grocery Shop. Sourced locally in Thanjavur, Tamil Nadu.</p>
            <p>Please present this invoice ID when collecting your order at the shop.</p>
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}
