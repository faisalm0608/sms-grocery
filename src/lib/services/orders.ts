import { db } from '../firebase';
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  query, 
  where 
} from 'firebase/firestore';
import { productsService } from './products';
import { customersService } from './customers';

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

export interface OrderItemMock {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  purchasePrice: number;
  sellingPrice: number;
}

export interface OrderMock {
  id: string;
  orderId: string;
  customerId: string;
  customerName: string;
  customerMobile: string;
  customerAddress: string;
  pickupTime: string;
  totalAmount: number;
  amount: number;
  tax: number;
  discount: number;
  status: 'PENDING' | 'ACCEPTED' | 'PACKING' | 'READY_FOR_PICKUP' | 'COMPLETED' | 'CANCELLED';
  orderStatus: 'PENDING' | 'ACCEPTED' | 'PACKING' | 'READY_FOR_PICKUP' | 'COMPLETED' | 'CANCELLED';
  paymentStatus: 'PENDING' | 'COMPLETED';
  upiTxnId?: string;
  createdAt: string;
  updatedAt: string;
  products: OrderItemMock[];
  items: OrderItemMock[];
}

export const ordersService = {
  async generateOrderId(): Promise<string> {
    const now = new Date();
    const dateStr = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`;
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `SMS-${dateStr}-${rand}`;
  },

  async getAllOrders() {
    try {
      const querySnapshot = await getDocs(collection(db, "orders"));
      const orders: OrderMock[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        orders.push({
          id: doc.id,
          orderId: data.orderId || doc.id,
          customerId: data.customerId || '',
          customerName: data.customerName || '',
          customerMobile: data.customerMobile || '',
          customerAddress: data.customerAddress || '',
          pickupTime: data.pickupTime || '',
          totalAmount: data.totalAmount || data.amount || 0,
          amount: data.amount || 0,
          tax: data.tax || 0,
          discount: data.discount || 0,
          status: data.status || data.orderStatus || 'PENDING',
          orderStatus: data.orderStatus || 'PENDING',
          paymentStatus: data.paymentStatus || 'PENDING',
          upiTxnId: data.upiTxnId || '',
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
          products: data.products || [],
          items: data.items || data.products || []
        });
      });
      // Sort desc by createdAt
      return orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } catch (e) {
      console.error("Firestore getAllOrders error:", e);
      return [];
    }
  },

  async getOrderById(id: string) {
    try {
      const docRef = doc(db, "orders", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          orderId: data.orderId || docSnap.id,
          customerId: data.customerId || '',
          customerName: data.customerName || '',
          customerMobile: data.customerMobile || '',
          customerAddress: data.customerAddress || '',
          pickupTime: data.pickupTime || '',
          totalAmount: data.totalAmount || data.amount || 0,
          amount: data.amount || 0,
          tax: data.tax || 0,
          discount: data.discount || 0,
          status: data.status || data.orderStatus || 'PENDING',
          orderStatus: data.orderStatus || 'PENDING',
          paymentStatus: data.paymentStatus || 'PENDING',
          upiTxnId: data.upiTxnId || '',
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
          products: data.products || [],
          items: data.items || data.products || []
        } as OrderMock;
      }
      return null;
    } catch (e) {
      console.error("Firestore getOrderById error:", e);
      return null;
    }
  },

  async getOrdersByCustomerMobile(mobile: string) {
    try {
      const cleaned = mobile.replace(/\D/g, '');
      const q = query(collection(db, "orders"), where("customerId", "==", cleaned));
      const querySnapshot = await getDocs(q);
      const orders: OrderMock[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        orders.push({
          id: doc.id,
          orderId: data.orderId || doc.id,
          customerId: data.customerId || '',
          customerName: data.customerName || '',
          customerMobile: data.customerMobile || '',
          customerAddress: data.customerAddress || '',
          pickupTime: data.pickupTime || '',
          totalAmount: data.totalAmount || data.amount || 0,
          amount: data.amount || 0,
          tax: data.tax || 0,
          discount: data.discount || 0,
          status: data.status || data.orderStatus || 'PENDING',
          orderStatus: data.orderStatus || 'PENDING',
          paymentStatus: data.paymentStatus || 'PENDING',
          upiTxnId: data.upiTxnId || '',
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
          products: data.products || [],
          items: data.items || data.products || []
        });
      });
      // Sort desc by createdAt
      return orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } catch (e) {
      console.error("Firestore getOrdersByCustomerMobile error:", e);
      return [];
    }
  },

  async createOrder(input: OrderInput) {
    const now = new Date();
    const orderId = await this.generateOrderId();
    const cleanedMobile = input.customerMobile.replace(/\D/g, '');
    
    // Resolve products to calculate total and snapshot prices
    const resolvedItems: OrderItemMock[] = [];
    let subtotal = 0;
    
    // Fetch products and adjust stock
    for (const item of input.items) {
      const p = await productsService.getProductById(item.productId);
      if (!p) throw new Error(`Product not found: ${item.productId}`);
      if (p.stockQuantity < item.quantity) {
        throw new Error(`Insufficient stock for product ${p.name}. Available: ${p.stockQuantity}, Requested: ${item.quantity}`);
      }
      
      resolvedItems.push({
        id: `item-${orderId}-${resolvedItems.length}`,
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
    await this.updateCustomerStats(cleanedMobile, input.customerName, input.customerAddress, totalAmount, loyaltyPointsEarned);

    try {
      const newOrder: OrderMock = {
        id: orderId,
        orderId: orderId,
        customerId: cleanedMobile,
        customerName: input.customerName,
        customerMobile: cleanedMobile,
        customerAddress: input.customerAddress,
        pickupTime: input.pickupTime,
        totalAmount,
        amount: totalAmount,
        tax,
        discount,
        status: 'PENDING',
        orderStatus: 'PENDING',
        paymentStatus: input.paymentStatus || 'PENDING',
        upiTxnId: input.upiTxnId || '',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        products: resolvedItems,
        items: resolvedItems
      };

      await setDoc(doc(db, "orders", orderId), newOrder);
      return newOrder;
    } catch (e) {
      console.error("Firestore createOrder error:", e);
      throw e;
    }
  },

  async updateOrderStatus(id: string, status: OrderMock['status']) {
    const now = new Date();
    try {
      const docRef = doc(db, "orders", id);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) throw new Error('Order not found');
      
      const data = docSnap.data();
      const updatedData: any = {
        status,
        orderStatus: status,
        updatedAt: now.toISOString()
      };
      
      // Auto mark completed payment if status is COMPLETED
      if (status === 'COMPLETED') {
        updatedData.paymentStatus = 'COMPLETED';
      }
      
      await updateDoc(docRef, updatedData);

      // If cancelled, return stock
      if (status === 'CANCELLED') {
        const items = data.items || data.products || [];
        for (const item of items) {
          await productsService.adjustStock(item.productId, item.quantity, 'STOCK_IN', `CANCEL: ${id}`);
        }
      }
      
      return {
        ...data,
        ...updatedData,
        id
      } as unknown as OrderMock;
    } catch (e) {
      console.error("Firestore updateOrderStatus error:", e);
      throw e;
    }
  },

  async updatePaymentStatus(id: string, paymentStatus: 'PENDING' | 'COMPLETED', upiTxnId?: string) {
    const now = new Date();
    try {
      const docRef = doc(db, "orders", id);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) throw new Error('Order not found');
      
      const updatedData: any = {
        paymentStatus,
        updatedAt: now.toISOString()
      };
      if (upiTxnId) updatedData.upiTxnId = upiTxnId;
      
      await updateDoc(docRef, updatedData);
      return {
        ...docSnap.data(),
        ...updatedData,
        id
      } as unknown as OrderMock;
    } catch (e) {
      console.error("Firestore updatePaymentStatus error:", e);
      throw e;
    }
  },

  async updateCustomerStats(mobile: string, name: string, address: string, spend: number, points: number) {
    const cleaned = mobile.replace(/\D/g, '');
    try {
      const custRef = doc(db, "customers", cleaned);
      const custSnap = await getDoc(custRef);
      const now = new Date().toISOString();
      
      if (custSnap.exists()) {
        const data = custSnap.data();
        const nextSpend = (data.totalSpend || 0) + spend;
        const nextPoints = (data.loyaltyPoints || 0) + points;
        await updateDoc(custRef, {
          name,
          address,
          totalSpend: nextSpend,
          loyaltyPoints: nextPoints,
          updatedAt: now
        });
      } else {
        await setDoc(custRef, {
          id: cleaned,
          mobileNumber: cleaned,
          name,
          address,
          totalSpend: spend,
          loyaltyPoints: points,
          createdAt: now,
          updatedAt: now
        });
      }
    } catch (e) {
      console.error("Firestore updateCustomerStats error:", e);
    }
  }
};
