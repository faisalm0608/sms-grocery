'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Download, Printer, Calendar, TrendingUp, 
  TrendingDown, Percent, Layers, ShoppingBag, ArrowUpRight
} from 'lucide-react';

interface SummaryData {
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

interface CategoryStat {
  category: string;
  sales: number;
  cost: number;
  profit: number;
  unitsSold: number;
}

interface ProductStat {
  id: string;
  name: string;
  category: string;
  sales: number;
  cost: number;
  profit: number;
  unitsSold: number;
}

export default function AdminReports() {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [categories, setCategories] = useState<CategoryStat[]>([]);
  const [products, setProducts] = useState<ProductStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReports() {
      try {
        const res = await fetch('/api/reports');
        if (res.ok) {
          const data = await res.json();
          setSummary(data.summary);
          setCategories(data.charts.categoryBreakdown);
          setProducts(data.charts.productLeaderboard);
        }
      } catch (e) {
        console.error('Failed to load reports:', e);
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, []);

  // Export to Excel CSV utility
  const handleExportCSV = (type: 'products' | 'categories') => {
    let headers: string[] = [];
    let rows: string[][] = [];
    let filename = '';

    if (type === 'products') {
      filename = 'sms_products_profit_report.csv';
      headers = ['Product ID', 'Product Name', 'Category', 'Units Sold', 'Total Revenue (INR)', 'Goods Cost (INR)', 'Net Profit (INR)'];
      rows = products.map(p => [
        p.id,
        p.name.replace(/,/g, ' '), // sanitize commas
        p.category,
        p.unitsSold.toString(),
        p.sales.toString(),
        p.cost.toString(),
        p.profit.toString()
      ]);
    } else {
      filename = 'sms_categories_margin_report.csv';
      headers = ['Category Name', 'Units Sold', 'Total Sales (INR)', 'Wholesale Cost (INR)', 'Net Profit (INR)', 'Gross Profit Margin (%)'];
      rows = categories.map(c => {
        const margin = Math.round((c.profit / c.sales) * 100) || 0;
        return [
          c.category,
          c.unitsSold.toString(),
          c.sales.toString(),
          c.cost.toString(),
          c.profit.toString(),
          `${margin}%`
        ];
      });
    }

    // Assemble CSV String
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    // Download link click simulation
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading || !summary) {
    return (
      <div className="flex h-96 flex-col items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="mt-4 text-sm text-foreground/50 font-bold">Generating sales audits...</p>
      </div>
    );
  }

  // Draw Category Bar Charts calculation helper
  const maxCategorySales = Math.max(...categories.map(c => c.sales), 500);

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">Net Profit & Analytics</h1>
          <p className="text-sm text-foreground/50 mt-1">Audit category margins, product performance, and export inventory spreadsheets.</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => handleExportCSV('products')}
            className="rounded-xl border border-border-color bg-card-bg px-4 py-2.5 text-xs font-bold hover:bg-foreground/5 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="h-4 w-4 text-primary" />
            Export Products (CSV)
          </button>
          <button
            onClick={handlePrint}
            className="rounded-xl bg-primary px-5 py-2.5 text-xs font-black text-white hover:bg-primary-hover shadow-md active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            Print Report
          </button>
        </div>
      </div>

      {/* Printable Title Block */}
      <div className="hidden print-only text-center border-b pb-4 mb-6">
        <h1 className="text-xl font-bold uppercase">SMS Grocery Shop - Sales & Profit Report</h1>
        <p className="text-xs text-gray-500 mt-1">Operational Audit Date: {new Date().toLocaleString('en-IN')}</p>
      </div>

      {/* Grid: 4 Timeframe summaries */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Daily */}
        <div className="rounded-2xl border border-border-color bg-card-bg p-5 shadow-xs space-y-2">
          <span className="text-[10px] font-bold text-foreground/45 uppercase tracking-wider block">Today's Summary</span>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-[10px] text-foreground/40 font-bold uppercase leading-none">Revenue</p>
              <h4 className="text-lg font-black text-foreground mt-1">₹{summary.daily.revenue}</h4>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-primary font-bold uppercase leading-none">Net Profit</p>
              <h4 className="text-base font-black text-primary mt-1">₹{summary.daily.profit}</h4>
            </div>
          </div>
        </div>

        {/* Weekly */}
        <div className="rounded-2xl border border-border-color bg-card-bg p-5 shadow-xs space-y-2">
          <span className="text-[10px] font-bold text-foreground/45 uppercase tracking-wider block">Weekly Summary</span>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-[10px] text-foreground/40 font-bold uppercase leading-none">Revenue</p>
              <h4 className="text-lg font-black text-foreground mt-1">₹{summary.weekly.revenue}</h4>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-primary font-bold uppercase leading-none">Net Profit</p>
              <h4 className="text-base font-black text-primary mt-1">₹{summary.weekly.profit}</h4>
            </div>
          </div>
        </div>

        {/* Monthly */}
        <div className="rounded-2xl border border-border-color bg-card-bg p-5 shadow-xs space-y-2">
          <span className="text-[10px] font-bold text-foreground/45 uppercase tracking-wider block">Monthly Summary</span>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-[10px] text-foreground/40 font-bold uppercase leading-none">Revenue</p>
              <h4 className="text-lg font-black text-foreground mt-1">₹{summary.monthly.revenue}</h4>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-primary font-bold uppercase leading-none">Net Profit</p>
              <h4 className="text-base font-black text-primary mt-1">₹{summary.monthly.profit}</h4>
            </div>
          </div>
        </div>

        {/* Annual */}
        <div className="rounded-2xl border border-border-color bg-card-bg p-5 shadow-xs space-y-2">
          <span className="text-[10px] font-bold text-foreground/45 uppercase tracking-wider block">Annual Summary</span>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-[10px] text-foreground/40 font-bold uppercase leading-none">Revenue</p>
              <h4 className="text-lg font-black text-foreground mt-1">₹{summary.annual.revenue}</h4>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-primary font-bold uppercase leading-none">Net Profit</p>
              <h4 className="text-base font-black text-primary mt-1">₹{summary.annual.profit}</h4>
            </div>
          </div>
        </div>

      </div>

      {/* Grid: Category bars chart and Product Leaderboards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Category Breakdown list with visual percentage bars */}
        <div className="rounded-2xl border border-border-color bg-card-bg p-5 shadow-xs space-y-4">
          <div className="flex justify-between items-center border-b border-border-color/50 pb-2">
            <h3 className="text-sm font-black text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="h-4.5 w-4.5 text-primary" />
              Category Margins
            </h3>
            <button 
              onClick={() => handleExportCSV('categories')}
              className="text-[10px] font-bold text-primary hover:underline flex items-center gap-0.5 no-print cursor-pointer"
            >
              Export Margins (CSV)
            </button>
          </div>

          <div className="space-y-4">
            {categories.map((c) => {
              const profitPct = Math.round((c.profit / c.sales) * 100) || 0;
              const barWidth = Math.max(10, (c.sales / maxCategorySales) * 100);

              return (
                <div key={c.category} className="space-y-1 text-xs">
                  <div className="flex justify-between font-bold text-foreground/80">
                    <span className="truncate">{c.category}</span>
                    <span className="font-black text-foreground">₹{c.sales} (Margin: {profitPct}%)</span>
                  </div>
                  
                  {/* Progress Bar container */}
                  <div className="h-2 w-full bg-foreground/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all duration-500" 
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-foreground/45 font-semibold leading-none pt-0.5">
                    <span>Sold: {c.unitsSold} units</span>
                    <span className="text-primary font-bold">Profit: ₹{Math.round(c.profit * 100) / 100}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Productwise Profit Leaderboard */}
        <div className="lg:col-span-2 rounded-2xl border border-border-color bg-card-bg p-5 shadow-xs flex flex-col h-auto">
          <h3 className="text-sm font-black text-foreground uppercase tracking-wider border-b border-border-color/50 pb-2 mb-3 shrink-0 flex items-center gap-1.5">
            <ShoppingBag className="h-4.5 w-4.5 text-primary" />
            Top 10 Profitable Products
          </h3>

          <div className="flex-1 overflow-x-auto border border-border-color rounded-xl">
            <table className="w-full text-left border-collapse text-xs font-semibold">
              <thead>
                <tr className="bg-foreground/5 text-[10px] font-bold text-foreground/60 uppercase">
                  <th className="p-3">Product Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3 text-center">Units Sold</th>
                  <th className="p-3 text-center">Total Revenue</th>
                  <th className="p-3 text-right">Net Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-color leading-normal">
                {products.map(p => (
                  <tr key={p.id} className="hover:bg-foreground/2">
                    <td className="p-3 font-bold text-foreground truncate max-w-[150px]">{p.name}</td>
                    <td className="p-3 text-foreground/50">{p.category}</td>
                    <td className="p-3 text-center font-bold text-foreground">{p.unitsSold}</td>
                    <td className="p-3 text-center font-semibold">₹{p.sales}</td>
                    <td className="p-3 text-right font-black text-primary flex items-center justify-end gap-1">
                      ₹{Math.round(p.profit * 100) / 100}
                      <ArrowUpRight className="h-3 w-3 shrink-0" />
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-foreground/45">
                      No sales data recorded yet. Complete POS bills or accept customer orders.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}
