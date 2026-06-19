'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  TrendingUp, TrendingDown, DollarSign, ShoppingBag, Users, AlertTriangle, 
  ChevronRight, ArrowUpRight, ArrowDownRight, PackageMinus, Flame, PackageCheck
} from 'lucide-react';

interface ReportSummary {
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  totalOrdersCount: number;
  activeOrdersCount: number;
  daily: { revenue: number; profit: number };
  weekly: { revenue: number; profit: number };
  monthly: { revenue: number; profit: number };
  annual: { revenue: number; profit: number };
}

interface ChartData {
  date: string;
  sales: number;
  profit: number;
}

interface AlertData {
  lowStock: { id: string; name: string; stock: number; reorderLevel: number }[];
  outOfStock: { id: string; name: string }[];
  expiringSoon: { id: string; name: string; expiryDate: string; daysRemaining: number }[];
}

export default function AdminDashboard() {
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [charts, setCharts] = useState<{ salesTrend: ChartData[] } | null>(null);
  const [alerts, setAlerts] = useState<AlertData | null>(null);
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const res = await fetch('/api/reports');
        if (res.ok) {
          const data = await res.json();
          setSummary(data.summary);
          setCharts(data.charts);
          setAlerts(data.alerts);
        }

        const ordersRes = await fetch('/api/orders');
        if (ordersRes.ok) {
          const orders = await ordersRes.json();
          // Filter to show active orders (Pending, Accepted, Packing, Ready)
          const active = orders.filter((o: any) => 
            o.status === 'PENDING' || o.status === 'ACCEPTED' || 
            o.status === 'PACKING' || o.status === 'READY_FOR_PICKUP'
          ).slice(0, 5);
          setActiveOrders(active);
        }
      } catch (e) {
        console.error('Failed to load dashboard data:', e);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  if (loading || !summary || !charts || !alerts) {
    return (
      <div className="flex h-96 flex-col items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="mt-4 text-sm text-foreground/50 font-bold">Loading dashboard metrics...</p>
      </div>
    );
  }

  // Draw SVG Chart calculation helper
  const trend = charts.salesTrend;
  const maxSales = Math.max(...trend.map(d => d.sales), 500);
  const chartHeight = 150;
  const chartWidth = 500;

  // Generate SVG coordinate points
  const salesPoints = trend.map((d, i) => {
    const x = (i / (trend.length - 1)) * chartWidth;
    const y = chartHeight - (d.sales / maxSales) * chartHeight;
    return `${x},${y}`;
  }).join(' ');

  const profitPoints = trend.map((d, i) => {
    const x = (i / (trend.length - 1)) * chartWidth;
    const y = chartHeight - (d.profit / maxSales) * chartHeight;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-foreground tracking-tight">Business Overview</h1>
        <p className="text-sm text-foreground/50 mt-1">Real-time statistics, sales margins, and operational alerts.</p>
      </div>

      {/* 4 Cards Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Gross Revenue */}
        <div className="rounded-2xl border border-border-color bg-card-bg p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-foreground/45 uppercase tracking-wider block">Gross Revenue</span>
            <h3 className="text-2xl font-black text-foreground">₹{summary.totalRevenue}</h3>
            <span className="text-xs text-primary font-bold flex items-center gap-0.5">
              <TrendingUp className="h-3 w-3" />
              +14% this month
            </span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <DollarSign className="h-6 w-6" />
          </div>
        </div>

        {/* Net Profit */}
        <div className="rounded-2xl border border-border-color bg-card-bg p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-foreground/45 uppercase tracking-wider block">Net Profit</span>
            <h3 className="text-2xl font-black text-foreground">₹{summary.totalProfit}</h3>
            <span className="text-xs text-primary font-bold flex items-center gap-0.5">
              <TrendingUp className="h-3 w-3" />
              Margin: {Math.round((summary.totalProfit / (summary.totalRevenue || 1)) * 100)}%
            </span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <TrendingUp className="h-6 w-6" />
          </div>
        </div>

        {/* Orders Placed */}
        <div className="rounded-2xl border border-border-color bg-card-bg p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-foreground/45 uppercase tracking-wider block">Total Sales Orders</span>
            <h3 className="text-2xl font-black text-foreground">{summary.totalOrdersCount}</h3>
            <span className="text-xs text-foreground/40 font-semibold block">
              Active: {summary.activeOrdersCount} Pending Pickup
            </span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <ShoppingBag className="h-6 w-6" />
          </div>
        </div>

        {/* Low Stock count */}
        <div className="rounded-2xl border border-border-color bg-card-bg p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-foreground/45 uppercase tracking-wider block">Inventory Alert</span>
            <h3 className="text-2xl font-black text-foreground">
              {alerts.lowStock.length + alerts.outOfStock.length}
            </h3>
            <span className="text-xs text-red-500 font-bold flex items-center gap-0.5">
              <AlertTriangle className="h-3 w-3 animate-pulse" />
              Requires Stock In
            </span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center">
            <PackageMinus className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Grid: Charts & Urgent alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Custom SVG Trend Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-border-color bg-card-bg p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-foreground uppercase tracking-wider">
              15-Day Revenue & Net Profit Trend
            </h3>
            <div className="flex gap-4 text-xs font-bold">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Sales
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-primary" />
                Net Profit
              </span>
            </div>
          </div>

          {/* SVG Canvas Chart */}
          <div className="relative pt-4 w-full">
            <svg 
              viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
              className="w-full overflow-visible"
              fill="none"
            >
              {/* Grid Lines */}
              <line x1="0" y1="0" x2={chartWidth} y2="0" stroke="currentColor" strokeOpacity="0.05" strokeDasharray="3 3" />
              <line x1="0" y1={chartHeight / 2} x2={chartWidth} y2={chartHeight / 2} stroke="currentColor" strokeOpacity="0.05" strokeDasharray="3 3" />
              <line x1="0" y1={chartHeight} x2={chartWidth} y2={chartHeight} stroke="currentColor" strokeOpacity="0.1" />

              {/* Sales Curve */}
              <polyline
                stroke="#10b981"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={salesPoints}
              />

              {/* Profit Curve */}
              <polyline
                stroke="#0c831f"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={profitPoints}
              />
            </svg>

            {/* X-axis Dates Labels */}
            <div className="flex justify-between mt-2.5 px-1 text-[9px] font-bold text-foreground/40 uppercase">
              <span>{trend[0]?.date}</span>
              <span>{trend[Math.floor(trend.length / 2)]?.date}</span>
              <span>{trend[trend.length - 1]?.date}</span>
            </div>
          </div>
        </div>

        {/* Low Stock/Alerts Box */}
        <div className="rounded-2xl border border-border-color bg-card-bg p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-black text-foreground uppercase tracking-wider flex items-center gap-2 border-b border-border-color/50 pb-2">
            <AlertTriangle className="h-4.5 w-4.5 text-red-500" />
            Critical Stock Alerts ({alerts.lowStock.length + alerts.outOfStock.length})
          </h3>

          <div className="space-y-3 max-h-56 overflow-y-auto no-scrollbar">
            {alerts.outOfStock.map(p => (
              <div key={p.id} className="flex items-center justify-between p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-xs font-bold text-red-600 dark:text-red-400">
                <span className="truncate max-w-[150px]">{p.name}</span>
                <span className="uppercase text-[9px] tracking-wider px-2 py-0.5 rounded-md bg-red-500 text-white shrink-0">Out of Stock</span>
              </div>
            ))}
            {alerts.lowStock.map(p => (
              <div key={p.id} className="flex items-center justify-between p-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-xs font-bold text-yellow-600 dark:text-yellow-400">
                <span className="truncate max-w-[150px]">{p.name}</span>
                <span className="shrink-0">Stock: {p.stock} (Min: {p.reorderLevel})</span>
              </div>
            ))}
            {alerts.expiringSoon.map(p => (
              <div key={p.id} className="flex items-center justify-between p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                <span className="truncate max-w-[150px]">{p.name}</span>
                <span className="shrink-0 flex items-center gap-1 font-black">
                  <Flame className="h-3.5 w-3.5" />
                  Exp: {p.daysRemaining} days
                </span>
              </div>
            ))}
            {alerts.lowStock.length === 0 && alerts.outOfStock.length === 0 && alerts.expiringSoon.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-center text-foreground/40 font-semibold text-xs">
                <PackageCheck className="h-8 w-8 text-primary mb-2" />
                All products levels healthy!
              </div>
            )}
          </div>
          <Link
            href="/admin/inventory"
            className="w-full block text-center rounded-xl bg-foreground text-background py-2 text-xs font-bold hover:opacity-90 active:scale-95 transition-all"
          >
            Adjust Stock / Purchase Entry
          </Link>
        </div>
      </div>

      {/* Grid: Active Orders Panel */}
      <div className="rounded-2xl border border-border-color bg-card-bg p-5 shadow-xs space-y-4">
        <div className="flex justify-between items-center border-b border-border-color/50 pb-2">
          <h3 className="text-sm font-black text-foreground uppercase tracking-wider">
            Active Orders ({activeOrders.length})
          </h3>
          <Link
            href="/admin/orders"
            className="text-xs text-primary font-bold hover:underline flex items-center gap-0.5"
          >
            View All Order Boards <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="overflow-x-auto border border-border-color rounded-xl">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-foreground/5 text-xs font-bold text-foreground/60 uppercase">
                <th className="p-3">Order ID</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Fulfillment</th>
                <th className="p-3 text-center">Amount</th>
                <th className="p-3 text-center">Fulfillment State</th>
                <th className="p-3 text-center">Payment</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-color font-semibold">
              {activeOrders.map(order => (
                <tr key={order.id} className="hover:bg-foreground/2">
                  <td className="p-3 font-mono font-black text-foreground">{order.id}</td>
                  <td className="p-3">
                    <span className="block font-bold text-foreground">{order.customerName}</span>
                    <span className="block text-[10px] text-foreground/45 font-mono">+91 {order.customerMobile}</span>
                  </td>
                  <td className="p-3 text-foreground/80">{order.pickupTime}</td>
                  <td className="p-3 text-center font-black">₹{order.totalAmount}</td>
                  <td className="p-3 text-center">
                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-black text-primary uppercase tracking-wider">
                      {order.status}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                      order.paymentStatus === 'COMPLETED' 
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                        : 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
                    }`}>
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <Link
                      href={`/admin/orders?highlight=${order.id}`}
                      className="rounded-lg bg-foreground text-background px-3 py-1.5 text-xs font-bold hover:opacity-90 transition-all cursor-pointer"
                    >
                      Update
                    </Link>
                  </td>
                </tr>
              ))}
              {activeOrders.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-foreground/40 font-bold">
                    No active pending orders. Excellent work!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
