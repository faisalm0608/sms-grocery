'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Search, Phone, MessageSquare, Printer, Check, ClipboardList, 
  Clock, Package, Truck, CheckCircle2, XCircle, ArrowUpDown
} from 'lucide-react';

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

function AdminOrdersContent() {
  const searchParams = useSearchParams();
  const highlightId = searchParams?.get('highlight') || null;
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'COMPLETED' | 'CANCELLED'>('ACTIVE');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  const loadOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data: Order[] = await res.json();
        setOrders(data);
        
        // Auto-select highlighted order or first active order
        if (highlightId) {
          const match = data.find(o => o.id === highlightId);
          if (match) setSelectedOrder(match);
        } else if (data.length > 0 && !selectedOrder) {
          const firstActive = data.find(o => o.status !== 'COMPLETED' && o.status !== 'CANCELLED');
          if (firstActive) setSelectedOrder(firstActive);
          else setSelectedOrder(data[0]);
        } else if (selectedOrder) {
          // Sync changes
          const match = data.find(o => o.id === selectedOrder.id);
          if (match) setSelectedOrder(match);
        }
      }
    } catch (e) {
      console.error('Failed to load orders:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    // Poll updates
    const interval = setInterval(loadOrders, 8000);
    return () => clearInterval(interval);
  }, [highlightId]);

  const updateStatus = async (orderId: string, status: Order['status']) => {
    setUpdating(true);
    setError('');
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        await loadOrders();
      } else {
        const d = await res.json();
        setError(d.message || 'Failed to update order status');
      }
    } catch (e) {
      setError('Connection error updating status.');
    } finally {
      setUpdating(false);
    }
  };

  const updatePayment = async (orderId: string, paymentStatus: 'PENDING' | 'COMPLETED') => {
    setUpdating(true);
    setError('');
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus })
      });
      if (res.ok) {
        await loadOrders();
      } else {
        const d = await res.json();
        setError(d.message || 'Failed to update payment status');
      }
    } catch (e) {
      setError('Connection error updating payment.');
    } finally {
      setUpdating(false);
    }
  };

  // Filter orders by Search and Tabs
  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchQuery
      ? order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerMobile.includes(searchQuery)
      : true;

    const matchesTab = activeTab === 'ACTIVE'
      ? order.status !== 'COMPLETED' && order.status !== 'CANCELLED'
      : activeTab === 'COMPLETED'
        ? order.status === 'COMPLETED'
        : order.status === 'CANCELLED';

    return matchesSearch && matchesTab;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return Clock;
      case 'ACCEPTED': return ClipboardList;
      case 'PACKING': return Package;
      case 'READY_FOR_PICKUP': return Truck;
      case 'COMPLETED': return CheckCircle2;
      case 'CANCELLED': return XCircle;
      default: return ClipboardList;
    }
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-foreground tracking-tight">Fulfillment Order Boards</h1>
        <p className="text-sm text-foreground/50 mt-1">Accept orders, track packing status, check off UPI logs, and trigger pickups.</p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 p-3.5 text-xs font-bold text-red-500 border border-red-500/20">
          {error}
        </div>
      )}

      {/* Tabs & Search Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        
        {/* State filters tabs */}
        <div className="flex rounded-xl bg-card-bg border border-border-color p-1 w-full sm:w-auto">
          {(['ACTIVE', 'COMPLETED', 'CANCELLED'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setSelectedOrder(null);
              }}
              className={`rounded-lg px-4 py-2 text-xs font-black transition-all cursor-pointer ${
                activeTab === tab
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-foreground/75 hover:text-foreground'
              }`}
            >
              {tab === 'ACTIVE' ? 'Active Orders' : tab === 'COMPLETED' ? 'Completed History' : 'Cancelled'}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Order ID or mobile..."
            className="w-full rounded-xl border border-border-color bg-card-bg py-2 pl-9 pr-4 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-semibold"
          />
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-foreground/45" />
        </div>
      </div>

      {/* Layout workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left side list board */}
        <div className="lg:col-span-1 rounded-2xl border border-border-color bg-card-bg p-4 shadow-xs h-[500px] flex flex-col">
          <h3 className="text-xs font-black text-foreground/50 uppercase tracking-widest border-b border-border-color/50 pb-2 mb-3 shrink-0">
            Order Receipts
          </h3>

          <div className="flex-1 overflow-y-auto space-y-2.5 no-scrollbar pr-0.5">
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-20 text-foreground/40 font-semibold text-xs leading-normal">
                No orders found.
              </div>
            ) : (
              filteredOrders.map(order => {
                const Icon = getStatusIcon(order.status);
                const isSelected = selectedOrder?.id === order.id;

                return (
                  <button
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className={`w-full rounded-xl border p-3 text-left transition-all flex justify-between items-start cursor-pointer ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border-color bg-background/35 hover:border-foreground/15'
                    }`}
                  >
                    <div className="space-y-1.5 min-w-0 mr-3">
                      <span className="font-mono text-xs font-black text-foreground block truncate">{order.id}</span>
                      <span className="text-[10px] text-foreground/50 block truncate font-bold">{order.customerName}</span>
                      <span className="text-[10px] font-bold text-foreground/40 block">{order.pickupTime}</span>
                    </div>

                    <div className="text-right shrink-0 space-y-1.5">
                      <span className="text-xs font-black text-foreground block">₹{order.totalAmount}</span>
                      <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${getStatusColor(order.status)}`}>
                        <Icon className="h-2.5 w-2.5" />
                        {order.status === 'READY_FOR_PICKUP' ? 'READY' : order.status}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right side order workspace details */}
        <div className="lg:col-span-2 rounded-2xl border border-border-color bg-card-bg p-6 shadow-xs h-[500px] flex flex-col">
          {selectedOrder ? (
            <div className="h-full flex flex-col">
              
              {/* Header details */}
              <div className="flex flex-col sm:flex-row justify-between items-start border-b border-border-color/50 pb-4 gap-4 shrink-0">
                <div>
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest">Selected Invoice details</span>
                  <h3 className="text-base font-black text-foreground font-mono select-all mt-0.5">{selectedOrder.id}</h3>
                  <span className="text-[10px] text-foreground/45 font-semibold">
                    Received: {new Date(selectedOrder.createdAt).toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                  <a
                    href={`tel:${selectedOrder.customerMobile}`}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1 rounded-lg border border-border-color py-1.5 px-3 text-xs font-bold text-foreground hover:bg-foreground/5 transition-all"
                  >
                    <Phone className="h-3.5 w-3.5 text-primary" />
                    Call
                  </a>
                  <a
                    href={`https://wa.me/91${selectedOrder.customerMobile}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1 rounded-lg border border-border-color py-1.5 px-3 text-xs font-bold text-foreground hover:bg-foreground/5 transition-all"
                  >
                    <MessageSquare className="h-3.5 w-3.5 text-emerald-500" />
                    Chat
                  </a>
                  <button
                    onClick={() => router.push(`/order/${selectedOrder.id}`)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1 rounded-lg bg-foreground text-background py-1.5 px-3 text-xs font-bold hover:opacity-90 transition-all cursor-pointer"
                  >
                    Invoice Page
                  </button>
                </div>
              </div>

              {/* Scrollable details container */}
              <div className="flex-1 overflow-y-auto py-4 space-y-6 no-scrollbar">
                
                {/* Status controls modifier panel */}
                <div className="rounded-xl border border-border-color bg-background/50 p-4 space-y-4">
                  <span className="text-[10px] font-black text-foreground/45 uppercase tracking-wider block">Fulfillment state modifiers</span>
                  
                  <div className="flex flex-wrap gap-2.5">
                    {selectedOrder.status === 'PENDING' && (
                      <button
                        onClick={() => updateStatus(selectedOrder.id, 'ACCEPTED')}
                        disabled={updating}
                        className="rounded-lg bg-blue-600 text-white font-extrabold text-xs px-4 py-2 hover:bg-blue-700 transition-all active:scale-95 cursor-pointer"
                      >
                        Accept Order
                      </button>
                    )}
                    {selectedOrder.status === 'ACCEPTED' && (
                      <button
                        onClick={() => updateStatus(selectedOrder.id, 'PACKING')}
                        disabled={updating}
                        className="rounded-lg bg-indigo-600 text-white font-extrabold text-xs px-4 py-2 hover:bg-indigo-700 transition-all active:scale-95 cursor-pointer"
                      >
                        Start Packing
                      </button>
                    )}
                    {selectedOrder.status === 'PACKING' && (
                      <button
                        onClick={() => updateStatus(selectedOrder.id, 'READY_FOR_PICKUP')}
                        disabled={updating}
                        className="rounded-lg bg-purple-600 text-white font-extrabold text-xs px-4 py-2 hover:bg-purple-700 transition-all active:scale-95 cursor-pointer"
                      >
                        Mark Ready for Pickup
                      </button>
                    )}
                    {selectedOrder.status === 'READY_FOR_PICKUP' && (
                      <button
                        onClick={() => updateStatus(selectedOrder.id, 'COMPLETED')}
                        disabled={updating}
                        className="rounded-lg bg-emerald-600 text-white font-extrabold text-xs px-4 py-2 hover:bg-emerald-700 transition-all active:scale-95 cursor-pointer"
                      >
                        Complete Order (Collected)
                      </button>
                    )}
                    
                    {/* Cancellation override */}
                    {selectedOrder.status !== 'COMPLETED' && selectedOrder.status !== 'CANCELLED' && (
                      <button
                        onClick={() => updateStatus(selectedOrder.id, 'CANCELLED')}
                        disabled={updating}
                        className="rounded-lg border border-red-500/20 text-red-500 font-bold text-xs px-4 py-2 hover:bg-red-500/5 transition-all active:scale-95 cursor-pointer"
                      >
                        Cancel Order
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs font-semibold pt-1 border-t border-border-color/30">
                    <span className="text-foreground/45 uppercase tracking-wider">Payment verification:</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      selectedOrder.paymentStatus === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-yellow-500/10 text-yellow-600'
                    }`}>
                      {selectedOrder.paymentStatus}
                    </span>
                    {selectedOrder.paymentStatus === 'PENDING' && (
                      <button
                        onClick={() => updatePayment(selectedOrder.id, 'COMPLETED')}
                        disabled={updating}
                        className="text-primary hover:underline text-[10px] font-extrabold cursor-pointer"
                      >
                        Confirm Receipt Payment
                      </button>
                    )}
                  </div>
                </div>

                {/* Info grid */}
                <div className="grid grid-cols-2 gap-4 text-xs font-semibold leading-relaxed">
                  <div className="space-y-1">
                    <span className="text-foreground/45 uppercase tracking-wider block">Customer Details</span>
                    <p className="font-extrabold text-foreground text-sm">{selectedOrder.customerName}</p>
                    <p className="font-mono text-foreground/75">Phone: +91 {selectedOrder.customerMobile}</p>
                    <p className="text-foreground/60">Address: {selectedOrder.customerAddress}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-foreground/45 uppercase tracking-wider block">Billing Summaries</span>
                    <p>Fulfillment: <strong>{selectedOrder.pickupTime}</strong></p>
                    <p>UPI Ref No: <span className="font-mono text-foreground/80">{selectedOrder.upiTxnId || 'N/A'}</span></p>
                    <p>Payment: <strong className="uppercase">{selectedOrder.paymentStatus}</strong></p>
                  </div>
                </div>

                {/* Items preview list */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-foreground/45 uppercase tracking-wider block">Ordered Items list</span>
                  <div className="border border-border-color rounded-xl overflow-hidden text-xs font-semibold">
                    <div className="bg-foreground/5 grid grid-cols-3 p-2.5 font-bold text-foreground/70 uppercase">
                      <span>Item</span>
                      <span className="text-center">Quantity</span>
                      <span className="text-right">Total Price</span>
                    </div>
                    <div className="divide-y divide-border-color">
                      {selectedOrder.items.map(item => (
                        <div key={item.id} className="grid grid-cols-3 p-2.5 hover:bg-foreground/2">
                          <span className="font-bold text-foreground truncate">{item.productName}</span>
                          <span className="text-center font-bold text-foreground">x{item.quantity}</span>
                          <span className="text-right font-black">₹{item.sellingPrice * item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>

              {/* Footer totals */}
              <div className="border-t border-border-color/50 pt-4 flex justify-between items-center shrink-0">
                <div className="text-xs text-foreground/45 font-semibold">
                  Tax: ₹{selectedOrder.tax} | Discount: ₹{selectedOrder.discount}
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-foreground/45 uppercase block leading-none">Grand Total</span>
                  <span className="text-xl font-black text-foreground">₹{selectedOrder.totalAmount}</span>
                </div>
              </div>

            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-foreground/40 font-semibold text-xs leading-normal">
              <ClipboardList className="h-12 w-12 text-foreground/15 mb-3" />
              Select an order receipt from the side board to view dashboard controls.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminOrders() {
  return (
    <Suspense fallback={
      <div className="flex h-96 items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    }>
      <AdminOrdersContent />
    </Suspense>
  );
}
