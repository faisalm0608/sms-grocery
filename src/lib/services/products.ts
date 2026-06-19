import { prisma, hasPostgresDb } from '../db';
import { getLocalDb, saveLocalDb, ProductMock } from './jsonDb';

export interface ProductInput {
  barcode?: string;
  name: string;
  image?: string;
  description?: string;
  category: string;
  purchasePrice: number;
  sellingPrice: number;
  stockQuantity?: number;
  reorderLevel?: number;
  supplierName?: string;
  expiryDate?: string | null;
}

export const productsService = {
  async getAllProducts() {
    if (hasPostgresDb) {
      return await prisma.product.findMany({
        orderBy: { name: 'asc' }
      });
    } else {
      const db = getLocalDb();
      return db.products.sort((a, b) => a.name.localeCompare(b.name));
    }
  },

  async getProductById(id: string) {
    if (hasPostgresDb) {
      return await prisma.product.findUnique({
        where: { id }
      });
    } else {
      const db = getLocalDb();
      return db.products.find(p => p.id === id) || null;
    }
  },

  async getProductByBarcode(barcode: string) {
    if (hasPostgresDb) {
      return await prisma.product.findUnique({
        where: { barcode }
      });
    } else {
      const db = getLocalDb();
      return db.products.find(p => p.barcode === barcode) || null;
    }
  },

  async createProduct(input: ProductInput) {
    const now = new Date();
    if (hasPostgresDb) {
      return await prisma.product.create({
        data: {
          barcode: input.barcode || null,
          name: input.name,
          image: input.image || null,
          description: input.description || null,
          category: input.category,
          purchasePrice: input.purchasePrice,
          sellingPrice: input.sellingPrice,
          stockQuantity: input.stockQuantity || 0,
          reorderLevel: input.reorderLevel || 5,
          supplierName: input.supplierName || null,
          expiryDate: input.expiryDate ? new Date(input.expiryDate) : null
        }
      });
    } else {
      const db = getLocalDb();
      const newProduct: ProductMock = {
        id: `prod-${Math.random().toString(36).substr(2, 9)}`,
        barcode: input.barcode || '',
        name: input.name,
        image: input.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=60',
        description: input.description || '',
        category: input.category,
        purchasePrice: input.purchasePrice,
        sellingPrice: input.sellingPrice,
        stockQuantity: input.stockQuantity || 0,
        reorderLevel: input.reorderLevel || 5,
        supplierName: input.supplierName || '',
        expiryDate: input.expiryDate || '',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      };
      
      db.products.push(newProduct);
      
      // Log inventory transaction
      if (newProduct.stockQuantity > 0) {
        db.inventoryTxns.push({
          id: `txn-${Math.random().toString(36).substr(2, 9)}`,
          productId: newProduct.id,
          productName: newProduct.name,
          quantity: newProduct.stockQuantity,
          type: 'STOCK_IN',
          reason: 'PRODUCT_CREATION',
          createdAt: now.toISOString()
        });
      }
      
      saveLocalDb(db);
      return newProduct;
    }
  },

  async updateProduct(id: string, input: Partial<ProductInput>) {
    const now = new Date();
    if (hasPostgresDb) {
      return await prisma.product.update({
        where: { id },
        data: {
          barcode: input.barcode,
          name: input.name,
          image: input.image,
          description: input.description,
          category: input.category,
          purchasePrice: input.purchasePrice,
          sellingPrice: input.sellingPrice,
          stockQuantity: input.stockQuantity,
          reorderLevel: input.reorderLevel,
          supplierName: input.supplierName,
          expiryDate: input.expiryDate === null ? null : (input.expiryDate ? new Date(input.expiryDate) : undefined)
        }
      });
    } else {
      const db = getLocalDb();
      const idx = db.products.findIndex(p => p.id === id);
      if (idx === -1) throw new Error('Product not found');
      
      const oldProd = db.products[idx];
      const prevStock = oldProd.stockQuantity;
      
      const updatedProduct: ProductMock = {
        ...oldProd,
        barcode: input.barcode !== undefined ? (input.barcode || '') : oldProd.barcode,
        name: input.name !== undefined ? input.name : oldProd.name,
        image: input.image !== undefined ? (input.image || '') : oldProd.image,
        description: input.description !== undefined ? (input.description || '') : oldProd.description,
        category: input.category !== undefined ? input.category : oldProd.category,
        purchasePrice: input.purchasePrice !== undefined ? input.purchasePrice : oldProd.purchasePrice,
        sellingPrice: input.sellingPrice !== undefined ? input.sellingPrice : oldProd.sellingPrice,
        stockQuantity: input.stockQuantity !== undefined ? input.stockQuantity : oldProd.stockQuantity,
        reorderLevel: input.reorderLevel !== undefined ? input.reorderLevel : oldProd.reorderLevel,
        supplierName: input.supplierName !== undefined ? (input.supplierName || '') : oldProd.supplierName,
        expiryDate: input.expiryDate !== undefined ? (input.expiryDate || '') : oldProd.expiryDate,
        updatedAt: now.toISOString()
      };
      
      db.products[idx] = updatedProduct;

      // Log stock adjustment if changed
      if (input.stockQuantity !== undefined && input.stockQuantity !== prevStock) {
        const diff = input.stockQuantity - prevStock;
        db.inventoryTxns.push({
          id: `txn-${Math.random().toString(36).substr(2, 9)}`,
          productId: id,
          productName: updatedProduct.name,
          quantity: Math.abs(diff),
          type: diff > 0 ? 'STOCK_IN' : 'STOCK_OUT',
          reason: 'MANUAL_ADJUSTMENT',
          createdAt: now.toISOString()
        });
      }
      
      saveLocalDb(db);
      return updatedProduct;
    }
  },

  async deleteProduct(id: string) {
    if (hasPostgresDb) {
      return await prisma.product.delete({
        where: { id }
      });
    } else {
      const db = getLocalDb();
      const idx = db.products.findIndex(p => p.id === id);
      if (idx === -1) throw new Error('Product not found');
      
      const deleted = db.products[idx];
      db.products.splice(idx, 1);
      
      // Clean up related inventory transactions and items if necessary
      db.inventoryTxns = db.inventoryTxns.filter(t => t.productId !== id);
      
      saveLocalDb(db);
      return deleted;
    }
  },

  async adjustStock(id: string, qty: number, type: 'STOCK_IN' | 'STOCK_OUT', reason: string) {
    const now = new Date();
    if (hasPostgresDb) {
      const p = await prisma.product.findUnique({ where: { id } });
      if (!p) throw new Error('Product not found');
      
      const newStock = type === 'STOCK_IN' 
        ? p.stockQuantity + qty 
        : Math.max(0, p.stockQuantity - qty);
        
      await prisma.inventoryTxn.create({
        data: {
          productId: id,
          quantity: qty,
          type,
          reason
        }
      });
      
      return await prisma.product.update({
        where: { id },
        data: { stockQuantity: newStock }
      });
    } else {
      const db = getLocalDb();
      const idx = db.products.findIndex(p => p.id === id);
      if (idx === -1) throw new Error('Product not found');
      
      const p = db.products[idx];
      const newStock = type === 'STOCK_IN' 
        ? p.stockQuantity + qty 
        : Math.max(0, p.stockQuantity - qty);
        
      p.stockQuantity = newStock;
      p.updatedAt = now.toISOString();
      
      db.inventoryTxns.push({
        id: `txn-${Math.random().toString(36).substr(2, 9)}`,
        productId: id,
        productName: p.name,
        quantity: qty,
        type,
        reason,
        createdAt: now.toISOString()
      });
      
      saveLocalDb(db);
      return p;
    }
  },

  async getInventoryTxns() {
    if (hasPostgresDb) {
      return await prisma.inventoryTxn.findMany({
        include: { product: true },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      const db = getLocalDb();
      // sort desc
      return db.inventoryTxns.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
  }
};
