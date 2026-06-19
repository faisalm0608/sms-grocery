'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '@/lib/context/AppContext';
import { 
  Search, ShoppingCart, Plus, Minus, Trash2, Printer, UserPlus, 
  UserCheck, ShieldCheck, CheckCircle2, RotateCcw, Barcode
} from 'lucide-react';
import QRCode from 'qrcode';

interface POSItem {
  id: string;
  name: string;
  category: string;
  purchasePrice: number;
  sellingPrice: number;
  quantity: number;
  stockQuantity: number;
}

export default function POSBilling() {
  const [products, setProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [posItems, setPosItems] = useState<POSItem[]>([]);
  
  // Customer selection
  const [customerMobile, setCustomerMobile] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPoints, setCustomerPoints] = useState(0);
  const [isCustomerFound, setIsCustomerFound] = useState(false);
  const [isNewCustomerForm, setIsNewCustomerForm] = useState(false);

  // Settings
  const [discountPercent, setDiscountPercent] = useState(0);
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'CARD' | 'UPI'>('CASH');
  const [upiQrUrl, setUpiQrUrl] = useState('');
  const [upiTxnId, setUpiTxnId] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successReceipt, setSuccessReceipt] = useState<any>(null);

  // Barcode scanner ref
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Load products list
  useEffect(() => {
    async function loadProducts() {
      try {
        const res = await fetch('/api/products');
        if (res.ok) {
          const data = await res.json();
          setProducts(data);
        }
      } catch (e) {}
    }
    loadProducts();
    
    // Automatically focus on barcode search input on mount to support USB scanner
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, []);

  // Sync UPI QR code if billing items or discount updates
  const subtotal = posItems.reduce((acc, item) => acc + (item.sellingPrice * item.quantity), 0);
  const discountAmount = Math.round(subtotal * (discountPercent / 100) * 100) / 100;
  const taxAmount = Math.round((subtotal - discountAmount) * 0.05 * 100) / 100; // 5% GST
  const grandTotal = Math.round((subtotal - discountAmount + taxAmount) * 100) / 100;

  useEffect(() => {
    if (paymentMode === 'UPI' && grandTotal > 0) {
      generateUpiQr();
    }
  }, [paymentMode, grandTotal]);

  const generateUpiQr = async () => {
    try {
      const upiLink = `upi://pay?pa=faisalmd0608@okaxis&pn=SMS%20Grocery%20Shop&am=${grandTotal}&cu=INR&tn=SMS%20POS%20Bill`;
      const qrUrl = await QRCode.toDataURL(upiLink, { width: 140, margin: 1 });
      setUpiQrUrl(qrUrl);
    } catch (e) {
      console.error('Failed to generate POS UPI QR Code:', e);
    }
  };

  // Search Customer on mobile change
  const handleCustomerSearch = async () => {
    if (customerMobile.length < 10) return;
    setError('');
    
    try {
      const res = await fetch('/api/customers');
      if (res.ok) {
        const data = await res.json();
        const me = data.find((c: any) => c.mobileNumber === customerMobile);
        if (me) {
          setCustomerName(me.name);
          setCustomerPoints(me.loyaltyPoints);
          setIsCustomerFound(true);
          setIsNewCustomerForm(false);
        } else {
          setIsCustomerFound(false);
          setIsNewCustomerForm(true); // Allow register
        }
      }
    } catch (e) {}
  };

  const handleRegisterCustomer = async () => {
    if (!customerName.trim() || customerMobile.length < 10) return;
    
    try {
      const res = await fetch('/api/customers/register', {
        // Fallback endpoint or inline creation since orders endpoint upserts.
        // We will just save locally during checkout process as our ordersService.createOrder automatically registers customers!
      });
      setIsCustomerFound(true);
      setIsNewCustomerForm(false);
    } catch (e) {}
  };

  // Barcode / Text search matching
  const handleProductSearch = (query: string) => {
    setSearchQuery(query);
    setError('');

    // Check exact barcode match first (essential for USB scanner firing automatically)
    const exactMatch = products.find(p => p.barcode === query);
    if (exactMatch) {
      addItemToPOS(exactMatch);
      setSearchQuery(''); // clear field
    }
  };

  const addItemToPOS = (prod: any) => {
    if (prod.stockQuantity <= 0) {
      setError(`Product "${prod.name}" is OUT OF STOCK.`);
      return;
    }

    const idx = posItems.findIndex(item => item.id === prod.id);
    if (idx > -1) {
      const newItems = [...posItems];
      if (newItems[idx].quantity >= prod.stockQuantity) {
        setError(`Cannot add more. Available stock for "${prod.name}" is ${prod.stockQuantity}.`);
        return;
      }
      newItems[idx].quantity += 1;
      setPosItems(newItems);
    } else {
      setPosItems([...posItems, {
        id: prod.id,
        name: prod.name,
        category: prod.category,
        purchasePrice: prod.purchasePrice,
        sellingPrice: prod.sellingPrice,
        quantity: 1,
        stockQuantity: prod.stockQuantity
      }]);
    }
  };

  const updateQuantity = (id: string, qty: number) => {
    if (qty <= 0) {
      setPosItems(posItems.filter(item => item.id !== id));
      return;
    }
    setPosItems(posItems.map(item => {
      if (item.id === id) {
        return { ...item, quantity: Math.min(qty, item.stockQuantity) };
      }
      return item;
    }));
  };

  const handleResetPOS = () => {
    setPosItems([]);
    setCustomerMobile('');
    setCustomerName('');
    setCustomerPoints(0);
    setIsCustomerFound(false);
    setIsNewCustomerForm(false);
    setDiscountPercent(0);
    setPaymentMode('CASH');
    setUpiTxnId('');
    setError('');
    setSuccessReceipt(null);
    if (barcodeInputRef.current) barcodeInputRef.current.focus();
  };

  const handleCheckoutPOS = async () => {
    setError('');
    setLoading(true);

    if (posItems.length === 0) {
      setError('Please add items to the POS bill first.');
      setLoading(false);
      return;
    }

    if (paymentMode === 'UPI' && !upiTxnId && grandTotal > 0) {
      setError('Please enter the UPI transaction Reference ID to log the transaction.');
      setLoading(false);
      return;
    }

    try {
      const posOrderData = {
        customerName: customerName.trim() || 'Walk-In Customer',
        customerMobile: customerMobile.trim() || '0000000000',
        customerAddress: 'In-Store Walk-In Purchase',
        pickupTime: 'Walk-In POS',
        items: posItems.map(item => ({
          productId: item.id,
          quantity: item.quantity
        })),
        discount: discountAmount,
        tax: taxAmount,
        paymentStatus: 'COMPLETED',
        upiTxnId: paymentMode === 'UPI' ? upiTxnId : `CASH-${Date.now()}`
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(posOrderData)
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to complete checkout.');
      }

      // Load receipt for print modal
      setSuccessReceipt(data);
      
      // Auto trigger print in a few milliseconds
      setTimeout(() => {
        window.print();
      }, 500);

    } catch (err: any) {
      setError(err.message || 'Failed to complete POS transaction.');
    } finally {
      setLoading(false);
    }
  };

  // Filter products matching query for list view
  const dropdownProducts = searchQuery.trim()
    ? products.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.barcode?.includes(searchQuery)
      ).slice(0, 5)
    : [];

  return (
    <div className="space-y-6">
      
      {/* Printable Invoice receipt modal popup overlay */}
      {successReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm print-only">
          <div className="w-full max-w-sm rounded-2xl border bg-white p-6 shadow-2xl text-black font-mono text-xs leading-normal">
            <div className="text-center border-b border-dashed border-gray-400 pb-4">
              <h2 className="text-base font-black uppercase">SMS Grocery Shop</h2>
              <p className="text-[10px] text-gray-500 mt-0.5">Thanjavur, Tamil Nadu</p>
              <p className="text-[10px] text-gray-500 font-bold">Owner: Mohammad Ali Jinnah (+91 9788045564)</p>
            </div>
            
            <div className="py-4 space-y-1">
              <p><strong>BILL NO:</strong> {successReceipt.id}</p>
              <p><strong>DATE:</strong> {new Date(successReceipt.createdAt).toLocaleString('en-IN')}</p>
              <p><strong>CUSTOMER:</strong> {successReceipt.customerName}</p>
              <p><strong>CONTACT:</strong> {successReceipt.customerMobile}</p>
              <p><strong>PAYMENT:</strong> {paymentMode} - COMPLETED</p>
            </div>

            <table className="w-full text-left border-t border-dashed border-gray-400 pt-2 border-collapse">
              <thead>
                <tr className="font-bold border-b border-dashed border-gray-400">
                  <th className="py-1">ITEM</th>
                  <th className="py-1 text-center">QTY</th>
                  <th className="py-1 text-right">TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {posItems.map(item => (
                  <tr key={item.id}>
                    <td className="py-1 max-w-[120px] truncate">{item.name}</td>
                    <td className="py-1 text-center">{item.quantity}</td>
                    <td className="py-1 text-right">₹{item.sellingPrice * item.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="border-t border-dashed border-gray-400 pt-3 mt-3 space-y-1 text-right">
              <p>SUBTOTAL: ₹{subtotal}</p>
              {discountAmount > 0 && <p className="text-green-700">DISCOUNT: -₹{discountAmount}</p>}
              <p>GST (5%): ₹{taxAmount}</p>
              <p className="text-sm font-black border-t border-dashed border-gray-400 pt-1">GRAND TOTAL: ₹{grandTotal}</p>
            </div>

            <div className="text-center border-t border-dashed border-gray-400 pt-4 mt-4 text-[9px] text-gray-500">
              <p>Thank you for shopping at SMS Grocery!</p>
              <p>Printed locally from Shop POS.</p>
              <button 
                onClick={handleResetPOS} 
                className="mt-4 no-print w-full rounded-lg bg-black py-2.5 text-xs font-black text-white cursor-pointer"
              >
                Close & Next Bill
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POS Screen Layout - Hidden on print */}
      <div className="no-print space-y-6">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">Billing & POS Terminal</h1>
          <p className="text-sm text-foreground/50 mt-1">Generate invoices, select walk-in customers, and log sales transactions.</p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-500/10 p-3.5 text-xs font-bold text-red-500 border border-red-500/20">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Billing items board left */}
          <div className="lg:col-span-2 space-y-5">
            {/* Barcode & Product search inputs */}
            <div className="rounded-2xl border border-border-color bg-card-bg p-5 shadow-xs relative">
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <input
                    ref={barcodeInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleProductSearch(e.target.value)}
                    placeholder="Scan barcode or type grocery item name..."
                    className="w-full rounded-xl border border-border-color bg-background/50 py-3 pl-10 pr-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium"
                  />
                  <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-foreground/40" />
                </div>
                <div className="h-11 w-12 border border-border-color rounded-xl flex items-center justify-center bg-foreground/5 text-foreground/50 hover:text-primary transition-colors cursor-pointer" title="Barcode Scanner Enabled">
                  <Barcode className="h-5 w-5" />
                </div>
              </div>

              {/* Matching products dropdown list */}
              {dropdownProducts.length > 0 && (
                <div className="absolute left-5 right-16 mt-2 rounded-xl border border-border-color bg-card-bg p-1.5 shadow-lg z-20 space-y-0.5">
                  {dropdownProducts.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        addItemToPOS(p);
                        setSearchQuery('');
                      }}
                      className="w-full flex items-center justify-between rounded-lg px-3.5 py-2.5 text-left text-xs font-bold text-foreground hover:bg-primary hover:text-white transition-colors cursor-pointer"
                    >
                      <div className="flex flex-col">
                        <span>{p.name}</span>
                        <span className="text-[10px] text-foreground/45 mt-0.5 group-hover:text-white/60 font-mono">Barcode: {p.barcode || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-foreground/10 px-1.5 py-0.5 rounded">Stock: {p.stockQuantity}</span>
                        <span>₹{p.sellingPrice}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* POS cart items table */}
            <div className="rounded-2xl border border-border-color bg-card-bg p-5 shadow-xs">
              <h3 className="text-sm font-black text-foreground border-b border-border-color/50 pb-2 mb-4 uppercase tracking-wider flex items-center gap-2">
                <ShoppingCart className="h-4.5 w-4.5 text-primary" />
                Receipt Billing Items ({posItems.length})
              </h3>

              <div className="overflow-x-auto border border-border-color rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-foreground/5 text-xs font-bold text-foreground/60 uppercase">
                      <th className="p-3">Product Name</th>
                      <th className="p-3 text-center">In Stock</th>
                      <th className="p-3 text-center">Unit Price</th>
                      <th className="p-3 text-center">Quantity</th>
                      <th className="p-3 text-right">Total</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-color font-semibold">
                    {posItems.map(item => (
                      <tr key={item.id} className="hover:bg-foreground/2">
                        <td className="p-3 font-bold text-foreground">{item.name}</td>
                        <td className="p-3 text-center">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                            item.stockQuantity <= 5 ? 'bg-red-500/10 text-red-500' : 'bg-foreground/5 text-foreground/60'
                          }`}>
                            {item.stockQuantity}
                          </span>
                        </td>
                        <td className="p-3 text-center">₹{item.sellingPrice}</td>
                        <td className="p-3 text-center">
                          <div className="inline-flex items-center rounded-lg border border-border-color bg-background">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="p-1 hover:text-primary transition-colors cursor-pointer"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-6 text-center text-xs font-black text-foreground">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="p-1 hover:text-primary transition-colors cursor-pointer"
                              disabled={item.quantity >= item.stockQuantity}
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        </td>
                        <td className="p-3 text-right font-black text-foreground">₹{item.sellingPrice * item.quantity}</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => updateQuantity(item.id, 0)}
                            className="text-foreground/45 hover:text-red-500 p-1 rounded-lg hover:bg-red-500/5 transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {posItems.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-foreground/40 font-bold">
                          Scan barcodes or search products to begin the billing.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right sidebar billing totals and customer registers */}
          <div className="space-y-6">
            
            {/* Customer select card */}
            <div className="rounded-2xl border border-border-color bg-card-bg p-5 shadow-xs space-y-4">
              <h3 className="text-xs font-black text-foreground/50 uppercase tracking-widest border-b border-border-color/50 pb-2 flex items-center justify-between">
                <span>Customer Register</span>
                {isCustomerFound ? <UserCheck className="h-4 w-4 text-primary" /> : <UserPlus className="h-4 w-4 text-foreground/40" />}
              </h3>

              <div className="space-y-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-foreground/60 uppercase tracking-wider mb-1.5">
                    Customer Mobile (10 Digits)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      value={customerMobile}
                      onChange={(e) => {
                        setCustomerMobile(e.target.value.replace(/\D/g, ''));
                        setIsCustomerFound(false);
                        setIsNewCustomerForm(false);
                      }}
                      placeholder="9788045564"
                      className="flex-1 rounded-lg border border-border-color bg-background/50 px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      maxLength={10}
                    />
                    <button
                      type="button"
                      onClick={handleCustomerSearch}
                      className="rounded-lg bg-foreground text-background px-3 py-2 text-xs font-bold hover:opacity-90 active:scale-95 transition-all cursor-pointer font-sans"
                    >
                      Find
                    </button>
                  </div>
                </div>

                {isCustomerFound && (
                  <div className="rounded-xl bg-primary/10 border border-primary/20 p-3 text-xs space-y-1 font-semibold text-foreground">
                    <p className="font-bold flex items-center gap-1">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      {customerName}
                    </p>
                    <p className="text-[10px] text-foreground/50 font-mono">Mobile: +91 {customerMobile}</p>
                    <p className="text-[10px] text-foreground/60">Loyalty Points Balance: <strong>{customerPoints} Points</strong></p>
                  </div>
                )}

                {isNewCustomerForm && (
                  <div className="rounded-xl bg-yellow-500/5 border border-yellow-500/15 p-3.5 space-y-3">
                    <span className="block text-[10px] font-bold text-yellow-600 dark:text-yellow-400">
                      New Customer Registration Required:
                    </span>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Enter customer name"
                      className="w-full rounded-lg border border-border-color bg-background/50 px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <button
                      type="button"
                      onClick={handleRegisterCustomer}
                      className="w-full rounded-lg bg-primary py-2 text-xs font-bold text-white hover:bg-primary-hover active:scale-95 transition-all cursor-pointer"
                    >
                      Confirm Register
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Billing breakdown calculations and payment method */}
            <div className="rounded-2xl border border-border-color bg-card-bg p-5 shadow-xs space-y-4">
              <h3 className="text-xs font-black text-foreground/50 uppercase tracking-widest border-b border-border-color/50 pb-2">
                Invoice Aggregates
              </h3>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between text-foreground/75 font-semibold">
                  <span>Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>
                
                {/* Discount override */}
                <div className="flex justify-between items-center text-foreground/75 font-semibold">
                  <span>Discount Override</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
                      className="w-12 text-center rounded border border-border-color px-1.5 py-0.5 bg-background text-xs font-bold focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <span>%</span>
                  </div>
                </div>

                <div className="flex justify-between text-foreground/75 font-semibold">
                  <span>GST Tax (5%)</span>
                  <span>₹{taxAmount}</span>
                </div>

                <div className="flex justify-between text-sm font-black text-foreground border-t border-border-color/50 pt-2.5">
                  <span>Grand Total</span>
                  <span>₹{grandTotal}</span>
                </div>
              </div>

              {/* Payment selector */}
              <div className="border-t border-border-color/50 pt-4 space-y-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-foreground/60 uppercase tracking-wider mb-2">
                    Select Payment Mode
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['CASH', 'CARD', 'UPI'] as const).map(mode => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setPaymentMode(mode)}
                        className={`rounded-lg py-2.5 text-xs font-bold border transition-all cursor-pointer ${
                          paymentMode === mode
                            ? 'border-primary bg-primary/5 text-primary shadow-xs'
                            : 'border-border-color bg-background text-foreground/75 hover:bg-foreground/5'
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                {paymentMode === 'UPI' && (
                  <div className="rounded-xl border border-border-color bg-background/50 p-3 text-center space-y-3">
                    <p className="text-[10px] text-foreground/60 font-semibold leading-relaxed">
                      Let customer scan this QR code on GPay, PhonePe, Paytm, or BHIM.
                    </p>
                    
                    {upiQrUrl ? (
                      <img src={upiQrUrl} alt="POS UPI QR" className="h-28 w-28 mx-auto border border-border-color rounded-xl bg-white p-1" />
                    ) : (
                      <div className="h-28 w-28 bg-foreground/10 animate-pulse mx-auto rounded-xl" />
                    )}

                    <input
                      type="text"
                      value={upiTxnId}
                      onChange={(e) => setUpiTxnId(e.target.value.replace(/\D/g, ''))}
                      placeholder="Scan/Enter 12-digit UPI Ref ID"
                      className="w-full text-center tracking-wider rounded-lg border border-border-color bg-background px-3 py-2 text-[10px] font-bold focus:outline-none focus:ring-1 focus:ring-primary"
                      maxLength={12}
                    />
                  </div>
                )}
              </div>

              {/* Checkout actions */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleResetPOS}
                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-border-color text-foreground/50 hover:text-foreground hover:bg-foreground/5 transition-colors cursor-pointer"
                  title="Clear POS Terminal"
                >
                  <RotateCcw className="h-4.5 w-4.5" />
                </button>
                <button
                  type="button"
                  onClick={handleCheckoutPOS}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-primary py-3.5 text-sm font-black text-white hover:bg-primary-hover shadow-md active:scale-95 transition-all cursor-pointer"
                >
                  <Printer className="h-4 w-4" />
                  {loading ? 'Processing...' : 'Complete & Print'}
                </button>
              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
