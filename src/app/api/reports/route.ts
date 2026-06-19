import { NextRequest, NextResponse } from 'next/server';
import { ordersService } from '@/lib/services/orders';
import { productsService } from '@/lib/services/products';

export async function GET(req: NextRequest) {
  try {
    // Admin check
    const sessionCookie = req.cookies.get('sms_session')?.value;
    let isAdmin = false;
    if (sessionCookie) {
      try {
        const session = JSON.parse(atob(sessionCookie));
        isAdmin = session.role === 'ADMIN';
      } catch (e) {}
    }

    if (!isAdmin) {
      return NextResponse.json({ message: 'Unauthorized. Admin privilege required.' }, { status: 403 });
    }

    const orders = (await ordersService.getAllOrders()) as any[];
    const products = (await productsService.getAllProducts()) as any[];

    // Filter COMPLETED orders for profit calculations
    const completedOrders = orders.filter(o => o.status === 'COMPLETED' || o.paymentStatus === 'COMPLETED');

    // 1. Calculate General Aggregates
    let totalRevenue = 0;
    let totalCost = 0;
    let totalProfit = 0;
    let totalOrdersCount = orders.length;
    let activeOrdersCount = orders.filter(o => o.status !== 'COMPLETED' && o.status !== 'CANCELLED').length;

    // Time-based stats
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    let dailyRevenue = 0, dailyProfit = 0;
    let weeklyRevenue = 0, weeklyProfit = 0;
    let monthlyRevenue = 0, monthlyProfit = 0;
    let annualRevenue = 0, annualProfit = 0;

    // Category and Product maps
    const categoryStats: Record<string, { category: string; sales: number; cost: number; profit: number; unitsSold: number }> = {};
    const productStats: Record<string, { id: string; name: string; category: string; sales: number; cost: number; profit: number; unitsSold: number }> = {};

    completedOrders.forEach((order: any) => {
      const orderDate = new Date(order.createdAt);
      
      order.items.forEach((item: any) => {
        const rev = item.sellingPrice * item.quantity;
        const cost = item.purchasePrice * item.quantity;
        const profit = rev - cost;

        totalRevenue += rev;
        totalCost += cost;
        totalProfit += profit;

        // Daily
        if (orderDate >= startOfToday) {
          dailyRevenue += rev;
          dailyProfit += profit;
        }
        // Weekly
        if (orderDate >= startOfWeek) {
          weeklyRevenue += rev;
          weeklyProfit += profit;
        }
        // Monthly
        if (orderDate >= startOfMonth) {
          monthlyRevenue += rev;
          monthlyProfit += profit;
        }
        // Annual
        if (orderDate >= startOfYear) {
          annualRevenue += rev;
          annualProfit += profit;
        }

        // Category stats
        // Try to look up category from active products list or default
        const activeProd = products.find((p: any) => p.id === item.productId);
        const cat = activeProd?.category || 'General';

        if (!categoryStats[cat]) {
          categoryStats[cat] = { category: cat, sales: 0, cost: 0, profit: 0, unitsSold: 0 };
        }
        categoryStats[cat].sales += rev;
        categoryStats[cat].cost += cost;
        categoryStats[cat].profit += profit;
        categoryStats[cat].unitsSold += item.quantity;

        // Product stats
        const prodId = item.productId;
        if (!productStats[prodId]) {
          productStats[prodId] = { 
            id: prodId, 
            name: item.productName || activeProd?.name || 'Unknown', 
            category: cat,
            sales: 0, 
            cost: 0, 
            profit: 0, 
            unitsSold: 0 
          };
        }
        productStats[prodId].sales += rev;
        productStats[prodId].cost += cost;
        productStats[prodId].profit += profit;
        productStats[prodId].unitsSold += item.quantity;
      });
    });

    // 2. Daily Sales Trend for Charts (Last 15 days)
    const dailyTrend: Record<string, { date: string; sales: number; profit: number }> = {};
    for (let i = 14; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dailyTrend[dateStr] = { date: dateStr, sales: 0, profit: 0 };
    }

    completedOrders.forEach((order: any) => {
      const orderDate = new Date(order.createdAt);
      const dateStr = orderDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (dailyTrend[dateStr] !== undefined) {
        order.items.forEach((item: any) => {
          const rev = item.sellingPrice * item.quantity;
          const cost = item.purchasePrice * item.quantity;
          dailyTrend[dateStr].sales += rev;
          dailyTrend[dateStr].profit += (rev - cost);
        });
      }
    });

    // 3. Alerts
    const lowStockAlerts = products
      .filter((p: any) => p.stockQuantity > 0 && p.stockQuantity <= p.reorderLevel)
      .map((p: any) => ({ id: p.id, name: p.name, stock: p.stockQuantity, reorderLevel: p.reorderLevel }));
      
    const outOfStockAlerts = products
      .filter((p: any) => p.stockQuantity === 0)
      .map((p: any) => ({ id: p.id, name: p.name }));

    const expiryAlerts = products
      .filter((p: any) => {
        if (!p.expiryDate) return false;
        const exp = new Date(p.expiryDate);
        const diffTime = exp.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 && diffDays <= 14; // expiring in next 14 days
      })
      .map(p => {
        const exp = new Date(p.expiryDate!);
        const diffTime = exp.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return {
          id: p.id,
          name: p.name,
          expiryDate: p.expiryDate,
          daysRemaining: diffDays
        };
      });

    return NextResponse.json({
      summary: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalCost: Math.round(totalCost * 100) / 100,
        totalProfit: Math.round(totalProfit * 100) / 100,
        totalOrdersCount,
        activeOrdersCount,
        daily: {
          revenue: Math.round(dailyRevenue * 100) / 100,
          profit: Math.round(dailyProfit * 100) / 100
        },
        weekly: {
          revenue: Math.round(weeklyRevenue * 100) / 100,
          profit: Math.round(weeklyProfit * 100) / 100
        },
        monthly: {
          revenue: Math.round(monthlyRevenue * 100) / 100,
          profit: Math.round(monthlyProfit * 100) / 100
        },
        annual: {
          revenue: Math.round(annualRevenue * 100) / 100,
          profit: Math.round(annualProfit * 100) / 100
        }
      },
      charts: {
        salesTrend: Object.values(dailyTrend),
        categoryBreakdown: Object.values(categoryStats),
        productLeaderboard: Object.values(productStats).sort((a, b) => b.profit - a.profit).slice(0, 10)
      },
      alerts: {
        lowStock: lowStockAlerts,
        outOfStock: outOfStockAlerts,
        expiringSoon: expiryAlerts
      }
    });

  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed to generate reports' }, { status: 500 });
  }
}
