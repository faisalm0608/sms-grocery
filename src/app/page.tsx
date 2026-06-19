'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Header from '@/components/shared/Header';
import Footer from '@/components/shared/Footer';
import CartDrawer from '@/components/customer/CartDrawer';
import WhatsAppButton from '@/components/shared/WhatsAppButton';
import { useApp, Product } from '@/lib/context/AppContext';
import { ChevronRight, Percent, ArrowRight, ShieldCheck, Clock, ThumbsUp } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const { addToCart, cart, updateCartQuantity } = useApp();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    async function loadProducts() {
      try {
        const res = await fetch('/api/products');
        const data = await res.json();
        if (res.ok) {
          setProducts(data);
        }
      } catch (e) {
        console.error('Failed to load products:', e);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  const categories = [
    { name: 'All', icon: '🛒' },
    { name: 'Fruits & Vegetables', icon: '🍎' },
    { name: 'Dairy, Bread & Eggs', icon: '🥛' },
    { name: 'Munchies & Chips', icon: '🍿' },
    { name: 'Cold Drinks & Juices', icon: '🥤' },
    { name: 'Rice, Atta & Dals', icon: '🌾' },
    { name: 'Masalas & Spices', icon: '🌶️' },
    { name: 'Personal Care', icon: '🧼' },
    { name: 'Household Essentials', icon: '🧹' }
  ];

  const filteredProducts = selectedCategory === 'All' 
    ? products 
    : products.filter(p => p.category === selectedCategory);

  // Group products by category to show "shelves" on Homepage when "All" is selected
  const categoriesList = ['Fruits & Vegetables', 'Dairy, Bread & Eggs', 'Munchies & Chips', 'Cold Drinks & Juices', 'Rice, Atta & Dals'];

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground transition-colors">
      <Suspense fallback={<div className="h-16 border-b border-border-color bg-card-bg" />}>
        <Header onCartToggle={() => setIsCartOpen(true)} />
      </Suspense>

      <main className="flex-1">
        {/* Hero Promotional Section */}
        <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 to-green-800 p-6 md:p-10 text-white shadow-xl">
            {/* Background design elements */}
            <div className="absolute right-0 top-0 -mr-20 -mt-20 h-80 w-80 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-60 w-60 rounded-full bg-emerald-500/20 blur-xl" />

            <div className="relative z-10 max-w-lg space-y-4">
              <div className="inline-flex items-center gap-1 rounded-full bg-yellow-400/20 border border-yellow-400/40 px-3 py-1 text-xs font-extrabold text-yellow-300">
                <Percent className="h-3 w-3" />
                GET FLAT 5% OFF
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
                SMS Grocery Shop
              </h1>
              <p className="text-sm md:text-base text-white/80 leading-relaxed font-medium">
                Fresh fruits, vegetables, milk, groceries, and home items at wholesale rates. Order online and pick up at your convenience!
              </p>
              
              <div className="pt-2 flex flex-wrap gap-4 text-xs md:text-sm font-semibold text-white/95">
                <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full">
                  <Clock className="h-4 w-4 text-yellow-400" />
                  7:00 AM - 10:30 PM
                </span>
                <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full">
                  <ShieldCheck className="h-4 w-4 text-yellow-400" />
                  100% Quality Freshness
                </span>
              </div>
            </div>
            
            <div className="absolute bottom-4 right-6 hidden lg:block text-8xl opacity-15">
              🍏🥛🌶️
            </div>
          </div>
        </section>

        {/* Category Round Badges */}
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black tracking-tight text-foreground">Explore Categories</h2>
          </div>
          
          <div className="flex items-center gap-4 overflow-x-auto pb-4 no-scrollbar scroll-smooth">
            {categories.map((cat) => (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className={`flex flex-col items-center justify-center shrink-0 rounded-2xl p-4 w-28 border text-center transition-all cursor-pointer ${
                  selectedCategory === cat.name
                    ? 'border-primary bg-primary/10 text-primary font-bold shadow-md scale-105'
                    : 'border-border-color bg-card-bg hover:border-foreground/20 text-foreground/75'
                }`}
              >
                <span className="text-3xl mb-2">{cat.icon}</span>
                <span className="text-xs tracking-tight line-clamp-2 leading-tight">{cat.name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Main Products Grid */}
        <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="mt-4 text-sm text-foreground/50 font-bold">Loading fresh items...</p>
            </div>
          ) : selectedCategory !== 'All' ? (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black text-foreground">{selectedCategory}</h2>
                <span className="text-xs font-bold text-foreground/50">{filteredProducts.length} Products found</span>
              </div>

              {filteredProducts.length === 0 ? (
                <div className="text-center py-16 rounded-2xl border border-dashed border-border-color bg-card-bg">
                  <p className="text-sm text-foreground/50 font-semibold">No items available in this category yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {filteredProducts.map((p) => (
                    <ProductCard key={p.id} product={p} addToCart={addToCart} cart={cart} updateCartQuantity={updateCartQuantity} />
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Grouped View (Zepto/Blinkit Homepage Shelves style) */
            <div className="space-y-10">
              {categoriesList.map((catName) => {
                const catProducts = products.filter(p => p.category === catName).slice(0, 5);
                if (catProducts.length === 0) return null;

                return (
                  <div key={catName} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-black text-foreground flex items-center gap-1.5">
                        {catName}
                        <ChevronRight className="h-4 w-4 text-primary" />
                      </h3>
                      <button
                        onClick={() => setSelectedCategory(catName)}
                        className="text-xs font-bold text-primary hover:underline flex items-center gap-0.5"
                      >
                        View All <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {catProducts.map((p) => (
                        <ProductCard key={p.id} product={p} addToCart={addToCart} cart={cart} updateCartQuantity={updateCartQuantity} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <Footer />
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <WhatsAppButton />
    </div>
  );
}

// Product Card Sub-component
function ProductCard({ 
  product, 
  addToCart, 
  cart, 
  updateCartQuantity 
}: { 
  product: Product; 
  addToCart: any; 
  cart: any[]; 
  updateCartQuantity: any; 
}) {
  const cartItem = cart.find(item => item.product.id === product.id);
  const qty = cartItem ? cartItem.quantity : 0;
  const isOutOfStock = product.stockQuantity === 0;
  const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= product.reorderLevel;

  // Simulated ratings & discount
  const discountPercent = Math.round(((product.purchasePrice * 1.3 - product.sellingPrice) / (product.purchasePrice * 1.3)) * 100);
  const displayDiscount = discountPercent > 5 ? `${discountPercent}% OFF` : 'Best Deal';

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border-color bg-card-bg p-3 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
      
      {/* Discount Badge */}
      <div className="absolute top-2.5 left-2.5 z-10 rounded-lg bg-primary px-2 py-1 text-[10px] font-black text-white">
        {displayDiscount}
      </div>

      {/* Image Panel */}
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-background/50 flex items-center justify-center">
        <img
          src={product.image}
          alt={product.name}
          className="object-cover h-full w-full group-hover:scale-105 transition-transform duration-300"
        />
        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-xs">
            <span className="rounded-lg bg-red-600 px-3 py-1 text-xs font-black text-white uppercase tracking-wider">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Info Panel */}
      <div className="mt-3 flex flex-col flex-1">
        <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-wider">
          {product.category}
        </span>
        <h4 className="text-sm font-bold text-foreground leading-snug tracking-tight mt-0.5 line-clamp-2 h-10">
          {product.name}
        </h4>
        
        {/* Rating and Stock chip */}
        <div className="flex items-center gap-2 mt-1">
          <span className="inline-flex items-center gap-0.5 rounded-sm bg-yellow-500/10 px-1 text-[10px] font-bold text-yellow-600 dark:text-yellow-400">
            ★ 4.5
          </span>
          {isLowStock && (
            <span className="text-[10px] font-bold text-yellow-600 dark:text-yellow-400">
              Only {product.stockQuantity} left
            </span>
          )}
        </div>

        {/* Price & Cart Actions */}
        <div className="mt-4 flex items-center justify-between pt-1">
          <div className="flex flex-col">
            <span className="text-base font-black text-foreground">₹{product.sellingPrice}</span>
            <span className="text-[10px] text-foreground/45 line-through">
              ₹{Math.round(product.sellingPrice * 1.15)}
            </span>
          </div>

          {!isOutOfStock && (
            <div>
              {qty > 0 ? (
                <div className="flex items-center rounded-xl bg-primary text-white font-extrabold shadow-sm border border-primary">
                  <button
                    onClick={() => updateCartQuantity(product.id, qty - 1)}
                    className="px-2.5 py-1.5 hover:bg-primary-hover rounded-l-xl transition-colors cursor-pointer"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-5 text-center text-xs">{qty}</span>
                  <button
                    onClick={() => updateCartQuantity(product.id, qty + 1)}
                    className="px-2.5 py-1.5 hover:bg-primary-hover rounded-r-xl transition-colors cursor-pointer"
                    disabled={qty >= product.stockQuantity}
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => addToCart(product)}
                  className="rounded-xl border border-primary px-4 py-1.5 text-xs font-black text-primary hover:bg-primary hover:text-white transition-all shadow-xs cursor-pointer"
                >
                  ADD
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Inline Plus/Minus components for simple rendering
function Plus(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function Minus(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
    </svg>
  );
}
