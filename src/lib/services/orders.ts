import { prisma, hasPostgresDb } from '../db';
import { getLocalDb, saveLocalDb, OrderMock, OrderItemMock } from './jsonDb';
import { productsService } from './products';

export interface OrderInputItem {
  productId: string;
  quantity: number;
}

export interface OrderInput {
  customerName: string;
  customerMobile: string;
  customerAddress: string;
  pickupTime: string;
  items: OrderInputItem[];
  discount?: number;
  tax?: number;
  paymentStatus?: 'PENDING' | 'COMPLETED';
  upiTxnId?: string;
}

export const ordersService = {
  async generateOrderId(): Promise<string> {
    const now = new Date();
    const dateStr = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`;
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `SMS-${dateStr}-${rand}`;
  },

  async getAllOrders() {
    if (hasPostgresDb) {
      return await prisma.order.findMany({
        include: {
          items: {
            include: { product: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      const db = getLocalDb();
      // sort desc
      return db.orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
  },

  async getOrderById(id: string) {
    if (hasPostgresDb) {
      return await prisma.order.findUnique({
        where: { id },
        include: {
          items: {
            include: { product: true }
          }
        }
      });
    } else {
      const db = getLocalDb();
      const order = db.orders.find(o => o.id === id);
      return order || null;
    }
  },

  async getOrdersByCustomerMobile(mobile: string) {
    if (hasPostgresDb) {
      return await prisma.order.findMany({
        where: { customerMobile: mobile },
        include: {
          items: {
            include: { product: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      const db = getLocalDb();
      return db.orders
        .filter(o => o.customerMobile === mobile)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
  },

  async createOrder(input: OrderInput) {
    const now = new Date();
    const orderId = await this.generateOrderId();
    
    // Resolve products to calculate total and snapshot prices
    const resolvedItems: { 
      productId: string; 
      productName: string;
      quantity: number; 
      purchasePrice: number; 
      sellingPrice: number; 
    }[] = [];
    
    let subtotal = 0;
    
    // Fetch products and adjust stock
    for (const item of input.items) {
      const p = await productsService.getProductById(item.productId);
      if (!p) throw new Error(`Product not found: ${item.productId}`);
      if (p.stockQuantity < item.quantity) {
        throw new Error(`Insufficient stock for product ${p.name}. Available: ${p.stockQuantity}, Requested: ${item.quantity}`);
      }
      
      resolvedItems.push({
        productId: item.productId,
        productName: p.name,
        quantity: item.quantity,
        purchasePrice: p.purchasePrice,
        sellingPrice: p.sellingPrice
      });
      
      subtotal += p.sellingPrice * item.quantity;
      
      // Auto adjust stock out
      await productsService.adjustStock(item.productId, item.quantity, 'STOCK_OUT', `SALE: ${orderId}`);
    }

    const discount = input.discount || (subtotal > 500 ? Math.floor(subtotal * 0.05) : 0); // Default 5% off over 500
    const tax = input.tax || Math.round((subtotal - discount) * 0.05 * 100) / 100; // Default 5% tax
    const totalAmount = Math.round((subtotal - discount + tax) * 100) / 100;

    // Update or Create Customer spend stats
    const loyaltyPointsEarned = Math.floor(totalAmount / 10); // 1 point per 10 INR
    await this.updateCustomerStats(input.customerMobile, input.customerName, input.customerAddress, totalAmount, loyaltyPointsEarned);

    if (hasPostgresDb) {
      return await prisma.order.create({
        data: {
          id: orderId,
          customerName: input.customerName,
          customerMobile: input.customerMobile,
          customerAddress: input.customerAddress,
          pickupTime: input.pickupTime || null,
          totalAmount,
          tax,
          discount,
          status: 'PENDING',
          paymentStatus: input.paymentStatus || 'PENDING',
          upiTxnId: input.upiTxnId || null,
          items: {
            create: resolvedItems.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              purchasePrice: item.purchasePrice,
              sellingPrice: item.sellingPrice
            }))
          }
        },
        include: {
          items: true
        }
      });
    } else {
      const db = getLocalDb();
      const newItems: OrderItemMock[] = resolvedItems.map((item, idx) => ({
        id: `item-${orderId}-${idx}`,
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        purchasePrice: item.purchasePrice,
        sellingPrice: item.sellingPrice
      }));

      const newOrder: OrderMock = {
        id: orderId,
        customerName: input.customerName,
        customerMobile: input.customerMobile,
        customerAddress: input.customerAddress,
        pickupTime: input.pickupTime,
        totalAmount,
        tax,
        discount,
        status: 'PENDING',
        paymentStatus: input.paymentStatus || 'PENDING',
        upiTxnId: input.upiTxnId,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        items: newItems
      };

      db.orders.push(newOrder);
      saveLocalDb(db);
      return newOrder;
    }
  },

  async updateOrderStatus(id: string, status: OrderMock['status']) {
    const now = new Date();
    if (hasPostgresDb) {
      return await prisma.order.update({
        where: { id },
        data: { status }
      });
    } else {
      const db = getLocalDb();
      const idx = db.orders.findIndex(o => o.id === id);
      if (idx === -1) throw new Error('Order not found');
      
      db.orders[idx].status = status;
      db.orders[idx].updatedAt = now.toISOString();
      
      // Auto mark completed payment if status is COMPLETED
      if (status === 'COMPLETED') {
        db.orders[idx].paymentStatus = 'COMPLETED';
      }
      
      // If cancelled, return stock
      if (status === 'CANCELLED') {
        const order = db.orders[idx];
        for (const item of order.items) {
          await productsService.adjustStock(item.productId, item.quantity, 'STOCK_IN', `CANCEL: ${id}`);
        }
      }
      
      saveLocalDb(db);
      return db.orders[idx];
    }
  },

  async updatePaymentStatus(id: string, paymentStatus: 'PENDING' | 'COMPLETED', upiTxnId?: string) {
    const now = new Date();
    if (hasPostgresDb) {
      return await prisma.order.update({
        where: { id },
        data: { 
          paymentStatus,
          upiTxnId
        }
      });
    } else {
      const db = getLocalDb();
      const idx = db.orders.findIndex(o => o.id === id);
      if (idx === -1) throw new Error('Order not found');
      
      db.orders[idx].paymentStatus = paymentStatus;
      if (upiTxnId) db.orders[idx].upiTxnId = upiTxnId;
      db.orders[idx].updatedAt = now.toISOString();
      
      saveLocalDb(db);
      return db.orders[idx];
    }
  },

  async updateCustomerStats(mobile: string, name: string, address: string, spend: number, points: number) {
    const now = new Date();
    if (hasPostgresDb) {
      const customer = await prisma.customer.findUnique({ where: { mobileNumber: mobile } });
      if (customer) {
        await prisma.customer.update({
          where: { mobileNumber: mobile },
          data: {
            name,
            address,
            totalSpend: customer.totalSpend + spend,
            loyaltyPoints: customer.loyaltyPoints + points
          }
        });
      } else {
        await prisma.customer.create({
          data: {
            mobileNumber: mobile,
            name,
            address,
            totalSpend: spend,
            loyaltyPoints: points
          }
        });
      }
    } else {
      const db = getLocalDb();
      const idx = db.customers.findIndex(c => c.mobileNumber === mobile);
      if (idx !== -1) {
        db.customers[idx].name = name;
        db.customers[idx].address = address;
        db.customers[idx].totalSpend += spend;
        db.customers[idx].loyaltyPoints += points;
        db.customers[idx].updatedAt = now.toISOString();
      } else {
        db.customers.push({
          mobileNumber: mobile,
          name,
          address,
          totalSpend: spend,
          loyaltyPoints: points,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString()
        });
      }
      saveLocalDb(db);
    }
  }
};
