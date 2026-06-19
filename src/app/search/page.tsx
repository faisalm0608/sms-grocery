'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/shared/Header';
import Footer from '@/components/shared/Footer';
import CartDrawer from '@/components/customer/CartDrawer';
import WhatsAppButton from '@/components/shared/WhatsAppButton';
import { useApp, Product } from '@/lib/context/AppContext';
import { SlidersHorizontal, ArrowUpDown, ChevronDown, ShoppingBag } from 'lucide-react';

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const query = searchParams?.get('q') || '';
  
  const { addToCart, cart, updateCartQuantity } = useApp();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('relevance');
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

  // Filter products by query and category
  const filteredProducts = products.filter(p => {
    const matchesQuery = query 
      ? p.name.toLowerCase().includes(query.toLowerCase()) || 
        p.category.toLowerCase().includes(query.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(query.toLowerCase())) ||
        (p.barcode && p.barcode.includes(query))
      : true;

    const matchesCategory = selectedCategory === 'All' 
      ? true 
      : p.category === selectedCategory;

    return matchesQuery && matchesCategory;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price-low') {
      return a.sellingPrice - b.sellingPrice;
    }
    if (sortBy === 'price-high') {
      return b.sellingPrice - a.sellingPrice;
    }
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    }
    return 0; // relevance / default
  });

  // Extract unique categories in query results for filter sidebar
  const activeCategories = Array.from(new Set(products.map(p => p.category)));

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground transition-colors">
      <Header onCartToggle={() => setIsCartOpen(true)} />

      <main className="flex-1 mx-auto max-w-7xl w-full px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Search header status */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-color pb-4">
          <div>
            <h1 className="text-2xl font-black text-foreground">
              {query ? `Search results for "${query}"` : 'All Groceries'}
            </h1>
            <p className="text-sm text-foreground/50 mt-1">
              Found {filteredProducts.length} items matching your filters
            </p>
          </div>

          {/* Sort controls */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold text-foreground/60 flex items-center gap-1">
              <ArrowUpDown className="h-3.5 w-3.5 text-primary" />
              Sort By:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-xl border border-border-color bg-card-bg px-3 py-1.5 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
            >
              <option value="relevance">Relevance</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="name">Product Name (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Search Layout Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Sidebar filters (Desktop only) */}
          <aside className="hidden md:block space-y-6">
            <div className="rounded-2xl border border-border-color bg-card-bg p-5 shadow-xs">
              <h3 className="text-xs font-black text-foreground/60 uppercase tracking-widest flex items-center gap-2 mb-4">
                <SlidersHorizontal className="h-4 w-4 text-primary" />
                Categories
              </h3>
              
              <ul className="space-y-1.5">
                <li>
                  <button
                    onClick={() => setSelectedCategory('All')}
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm font-semibold transition-colors cursor-pointer ${
                      selectedCategory === 'All'
                        ? 'bg-primary/10 text-primary font-bold'
                        : 'text-foreground/70 hover:bg-foreground/5'
                    }`}
                  >
                    All Categories
                  </button>
                </li>
                {activeCategories.map((cat) => (
                  <li key={cat}>
                    <button
                      onClick={() => setSelectedCategory(cat)}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm font-semibold transition-colors cursor-pointer ${
                        selectedCategory === cat
                          ? 'bg-primary/10 text-primary font-bold'
                          : 'text-foreground/70 hover:bg-foreground/5'
                      }`}
                    >
                      {cat}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Mobile category selectors dropdown */}
          <div className="md:hidden flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`rounded-full px-4 py-1.5 text-xs font-bold border transition-colors cursor-pointer ${
                selectedCategory === 'All'
                  ? 'bg-primary text-white border-primary'
                  : 'bg-card-bg border-border-color text-foreground/80'
              }`}
            >
              All Categories
            </button>
            {activeCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-full px-4 py-1.5 text-xs font-bold border shrink-0 transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-primary text-white border-primary'
                    : 'bg-card-bg border-border-color text-foreground/80'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Products grid */}
          <div className="md:col-span-3">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="mt-4 text-sm text-foreground/50 font-bold">Searching items...</p>
              </div>
            ) : sortedProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-border-color rounded-2xl bg-card-bg">
                <p className="text-sm text-foreground/50 font-bold">No products found matching your search.</p>
                <p className="text-xs text-foreground/40 mt-1 max-w-[240px]">
                  Try typing general terms like "milk", "lays", or check your spelling.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {sortedProducts.map((p) => (
                  <ProductCard key={p.id} product={p} addToCart={addToCart} cart={cart} updateCartQuantity={updateCartQuantity} />
                ))}
              </div>
            )}
          </div>
        </div>
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

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border-color bg-card-bg p-3 shadow-xs transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
      
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
                    className="px-2 py-1 hover:bg-primary-hover rounded-l-xl transition-colors cursor-pointer"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-5 text-center text-xs">{qty}</span>
                  <button
                    onClick={() => updateCartQuantity(product.id, qty + 1)}
                    className="px-2 py-1 hover:bg-primary-hover rounded-r-xl transition-colors cursor-pointer"
                    disabled={qty >= product.stockQuantity}
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => addToCart(product)}
                  className="rounded-xl border border-primary px-3.5 py-1.5 text-xs font-black text-primary hover:bg-primary hover:text-white transition-all shadow-xs cursor-pointer"
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

function Plus(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-3 w-3" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function Minus(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-3 w-3" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
    </svg>
  );
}

export default function SearchResults() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    }>
      <SearchResultsContent />
    </Suspense>
  );
}
