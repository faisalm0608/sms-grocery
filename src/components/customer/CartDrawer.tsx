'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/context/AppContext';
import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight } from 'lucide-react';
import Image from 'next/image';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const router = useRouter();
  const { cart, updateCartQuantity, removeFromCart } = useApp();

  if (!isOpen) return null;

  const cartSubtotal = cart.reduce((acc, item) => acc + (item.product.sellingPrice * item.quantity), 0);
  const cartSavings = cart.reduce((acc, item) => acc + ((item.product.sellingPrice - item.product.purchasePrice) * 0.1 * item.quantity), 0); // Simulated discount savings
  const estimatedDiscount = cartSubtotal > 500 ? Math.floor(cartSubtotal * 0.05) : 0;
  const estimatedTax = Math.round((cartSubtotal - estimatedDiscount) * 0.05 * 100) / 100;
  const cartTotal = cartSubtotal - estimatedDiscount + estimatedTax;

  const handleCheckoutClick = () => {
    onClose();
    router.push('/cart');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden no-print" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-black/55 backdrop-blur-xs transition-opacity animate-fade-in"
      />

      <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-md transform bg-card-bg shadow-2xl transition-all duration-300 animate-slide-up h-full flex flex-col border-l border-border-color">
          
          {/* Header */}
          <div className="flex h-16 items-center justify-between px-6 border-b border-border-color shrink-0">
            <h2 className="text-lg font-black text-foreground flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-primary" />
              My Cart
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                {cart.length} Items
              </span>
            </h2>
            <button
              onClick={onClose}
              className="text-foreground/50 hover:text-foreground hover:bg-foreground/10 p-1.5 rounded-full transition-colors cursor-pointer"
            >
              <span className="sr-only">Close panel</span>
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <ShoppingBag className="h-16 w-16 text-foreground/20 mb-4 stroke-1" />
                <h3 className="text-base font-bold text-foreground">Your cart is empty</h3>
                <p className="text-sm text-foreground/50 mt-1 max-w-[200px]">
                  Add items from the store to start checkout!
                </p>
                <button
                  onClick={onClose}
                  className="mt-6 rounded-xl bg-primary px-6 py-2.5 text-xs font-bold text-white hover:bg-primary-hover shadow-md transition-all cursor-pointer"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              cart.map((item) => (
                <div 
                  key={item.product.id}
                  className="flex items-center justify-between border-b border-border-color/50 pb-4 last:border-b-0"
                >
                  {/* Product Details */}
                  <div className="flex items-center gap-3 flex-1 min-w-0 mr-4">
                    <div className="relative h-14 w-14 overflow-hidden rounded-xl border border-border-color bg-background/50 shrink-0">
                      {/* Using HTML img tag to avoid complex NextJS image domains setup during offline mock dev */}
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="object-cover h-full w-full"
                      />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-foreground truncate">{item.product.name}</h4>
                      <p className="text-xs text-foreground/50 mt-0.5 truncate">{item.product.category}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-black text-foreground">₹{item.product.sellingPrice}</span>
                        {item.product.sellingPrice < item.product.purchasePrice * 1.2 && (
                          <span className="text-xs font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                            Offer
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quantity Actions */}
                  <div className="flex items-center gap-2.5">
                    <div className="flex items-center rounded-lg border border-border-color bg-background">
                      <button
                        onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                        className="p-1 hover:text-primary transition-colors cursor-pointer"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-6 text-center text-xs font-extrabold text-foreground">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                        className="p-1 hover:text-primary transition-colors cursor-pointer"
                        disabled={item.quantity >= item.product.stockQuantity}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-foreground/45 hover:text-red-500 p-1 rounded-lg hover:bg-red-500/5 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pricing & Checkout */}
          {cart.length > 0 && (
            <div className="border-t border-border-color bg-background/50 p-6 space-y-4 shrink-0">
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-semibold text-foreground/75">
                  <span>Subtotal</span>
                  <span>₹{cartSubtotal}</span>
                </div>
                {estimatedDiscount > 0 && (
                  <div className="flex justify-between text-sm font-semibold text-primary">
                    <span>Store Discount (5%)</span>
                    <span>-₹{estimatedDiscount}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-semibold text-foreground/75">
                  <span>GST (5%)</span>
                  <span>₹{estimatedTax}</span>
                </div>
                <div className="flex justify-between text-base font-black text-foreground border-t border-border-color/50 pt-2">
                  <span>Total Bill</span>
                  <span>₹{Math.round(cartTotal * 100) / 100}</span>
                </div>
              </div>

              {/* simulated savings tip */}
              <div className="rounded-xl bg-primary/10 p-3 text-center text-xs font-bold text-primary">
                Savings: You will save roughly ₹{Math.round((estimatedDiscount + cartSavings) * 100) / 100} on this order!
              </div>

              <button
                onClick={handleCheckoutClick}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-bold text-white shadow-lg hover:bg-primary-hover active:scale-95 transition-all cursor-pointer"
              >
                Proceed to Checkout
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
