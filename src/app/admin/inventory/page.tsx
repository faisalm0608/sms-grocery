'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, Plus, Minus, ClipboardCheck, History, AlertTriangle, 
  ChevronRight, ArrowUpRight, ArrowDownRight, RefreshCw, Layers
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  category: string;
  stockQuantity: number;
  reorderLevel: number;
}

interface InventoryTxn {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  type: 'STOCK_IN' | 'STOCK_OUT';
  reason: string;
  createdAt: string;
  product?: { name: string };
}

export default function AdminInventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<InventoryTxn[]>([]);
  const [alerts, setAlerts] = useState<any>({ lowStock: [], outOfStock: [], expiring: [] });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form State
  const [selectedProductId, setSelectedProductId] = useState('');
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustType, setAdjustType] = useState<'STOCK_IN' | 'STOCK_OUT'>('STOCK_IN');
  const [adjustReason, setAdjustReason] = useState('PURCHASE_ENTRY');

  const loadData = async () => {
    try {
      const resReports = await fetch('/api/reports');
      if (resReports.ok) {
        const data = await resReports.json();
        setAlerts(data.alerts);
      }

      const resProducts = await fetch('/api/products');
      if (resProducts.ok) {
        const data = await resProducts.json();
        setProducts(data);
        if (data.length > 0 && !selectedProductId) {
          setSelectedProductId(data[0].id);
        }
      }

      // Fetch transaction logs
      const resTxns = await fetch('/api/products'); // fallback to inline call
      // Since we defined productsService.getInventoryTxns() inside API layer, let's create a specific API route or inline query
      const resOrders = await fetch('/api/orders'); // read logs or orders
      // Wait, let's look at how we can load transaction logs. We added productsService.getInventoryTxns() in services/products.ts.
      // Let's call products endpoint or check if we have a transaction endpoint.
      // Let's create an endpoint '/api/products/transactions' or use products.ts.
      // Actually, let's fetch transaction logs from `/api/inventory/transactions` which we will add, or we can load them directly.
      const txnRes = await fetch('/api/inventory');
      if (txnRes.ok) {
        const txns = await txnRes.json();
        setTransactions(txns);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const parsedQty = parseInt(adjustQty);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      setError('Please enter a valid stock quantity.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProductId,
          quantity: parsedQty,
          type: adjustType,
          reason: adjustReason
        })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to adjust stock.');
      }

      setSuccess('Inventory stock adjusted and logged successfully!');
      setAdjustQty('');
      await loadData();
      
      // Auto clear success
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Error occurred while updating inventory.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">Inventory Logs & Control</h1>
          <p className="text-sm text-foreground/50 mt-1">Audit stock movements, log supply entries, and handle write-offs.</p>
        </div>
        <button
          onClick={loadData}
          className="rounded-xl border border-border-color p-2.5 text-foreground/60 hover:text-foreground hover:bg-foreground/5 transition-colors cursor-pointer"
          title="Refresh Logs"
        >
          <RefreshCw className="h-4.5 w-4.5" />
        </button>
      </div>

      {success && (
        <div className="rounded-lg bg-emerald-500/10 p-3.5 text-xs font-bold text-emerald-600 border border-emerald-500/25">
          {success}
        </div>
      )}
      {error && (
        <div className="rounded-lg bg-red-500/10 p-3.5 text-xs font-bold text-red-500 border border-red-500/20">
          {error}
        </div>
      )}

      {/* Grid for adjustment form & critical stock logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Adjustment form */}
        <div className="rounded-2xl border border-border-color bg-card-bg p-5 shadow-xs h-fit space-y-4">
          <h3 className="text-sm font-black text-foreground uppercase tracking-wider flex items-center gap-2 border-b border-border-color/50 pb-2">
            <Layers className="h-4.5 w-4.5 text-primary" />
            Stock Adjustment Form
          </h3>

          <form onSubmit={handleAdjustStock} className="space-y-4 text-xs font-semibold">
            {/* Product selection */}
            <div>
              <label className="block text-[10px] font-bold text-foreground/75 uppercase tracking-wider mb-1.5">
                Select Product Item
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full rounded-lg border border-border-color bg-background/50 px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} (In stock: {p.stockQuantity})
                  </option>
                ))}
              </select>
            </div>

            {/* Adjust type */}
            <div>
              <label className="block text-[10px] font-bold text-foreground/75 uppercase tracking-wider mb-1.5">
                Adjustment Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAdjustType('STOCK_IN');
                    setAdjustReason('PURCHASE_ENTRY');
                  }}
                  className={`rounded-lg py-2 text-xs font-black border transition-all cursor-pointer ${
                    adjustType === 'STOCK_IN'
                      ? 'border-primary bg-primary/5 text-primary shadow-xs'
                      : 'border-border-color bg-background text-foreground/75 hover:bg-foreground/5'
                  }`}
                >
                  Stock In (+)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAdjustType('STOCK_OUT');
                    setAdjustReason('EXPIRED_DISPOSAL');
                  }}
                  className={`rounded-lg py-2 text-xs font-black border transition-all cursor-pointer ${
                    adjustType === 'STOCK_OUT'
                      ? 'border-primary bg-primary/5 text-primary shadow-xs'
                      : 'border-border-color bg-background text-foreground/75 hover:bg-foreground/5'
                  }`}
                >
                  Stock Out (-)
                </button>
              </div>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-[10px] font-bold text-foreground/75 uppercase tracking-wider mb-1.5">
                Quantity Count
              </label>
              <input
                type="number"
                value={adjustQty}
                onChange={(e) => setAdjustQty(e.target.value)}
                placeholder="e.g. 24"
                className="w-full rounded-lg border border-border-color bg-background/50 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary font-bold"
                required
              />
            </div>

            {/* Reason */}
            <div>
              <label className="block text-[10px] font-bold text-foreground/75 uppercase tracking-wider mb-1.5">
                Adjustment Reason
              </label>
              <select
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                className="w-full rounded-lg border border-border-color bg-background/50 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                {adjustType === 'STOCK_IN' ? (
                  <>
                    <option value="PURCHASE_ENTRY">Supplier Purchase Entry (Supply In)</option>
                    <option value="CUSTOMER_RETURN">Customer Returns</option>
                    <option value="MANUAL_ADJUSTMENT">Stock Audit Inward</option>
                  </>
                ) : (
                  <>
                    <option value="EXPIRED_DISPOSAL">Expired Stock Disposal</option>
                    <option value="DAMAGE_WRITE_OFF">Broken / Damaged Write-off</option>
                    <option value="THEFT_LOSS">Shrinkage / Stock Loss</option>
                    <option value="MANUAL_ADJUSTMENT">Stock Audit Outward</option>
                  </>
                )}
              </select>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-primary py-3.5 text-xs font-black text-white hover:bg-primary-hover shadow-md active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <ClipboardCheck className="h-4 w-4" />
              {submitting ? 'Updating...' : 'Adjust Stock Inward'}
            </button>
          </form>
        </div>

        {/* Audit logs listing table right */}
        <div className="lg:col-span-2 rounded-2xl border border-border-color bg-card-bg p-5 shadow-xs flex flex-col h-[500px]">
          <h3 className="text-sm font-black text-foreground uppercase tracking-wider border-b border-border-color/50 pb-2 mb-3 shrink-0 flex items-center gap-2">
            <History className="h-4.5 w-4.5 text-primary" />
            Stock Ledger History
          </h3>

          <div className="flex-1 overflow-y-auto border border-border-color rounded-xl">
            <table className="w-full text-left border-collapse text-[11px] leading-normal">
              <thead>
                <tr className="bg-foreground/5 text-[10px] font-bold text-foreground/60 uppercase">
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Product Name</th>
                  <th className="p-3 text-center">Type</th>
                  <th className="p-3 text-center">Amount</th>
                  <th className="p-3 text-right">Fulfillment Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-color font-semibold">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center">
                      <div className="h-5 w-5 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-foreground/45">
                      No stock movement logs recorded.
                    </td>
                  </tr>
                ) : (
                  transactions.map(txn => (
                    <tr key={txn.id} className="hover:bg-foreground/2">
                      <td className="p-3 text-foreground/45">
                        {new Date(txn.createdAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="p-3 font-bold text-foreground truncate max-w-[150px]">{txn.productName}</td>
                      <td className="p-3 text-center">
                        <span className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px] font-black uppercase ${
                          txn.type === 'STOCK_IN' 
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                            : 'bg-red-500/10 text-red-600 dark:text-red-400'
                        }`}>
                          {txn.type === 'STOCK_IN' ? '+' : '-'} {txn.type.split('_')[1] || txn.type}
                        </span>
                      </td>
                      <td className="p-3 text-center font-black text-foreground">{txn.quantity}</td>
                      <td className="p-3 text-right text-foreground/60 font-mono text-[10px] max-w-[120px] truncate">{txn.reason}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}
