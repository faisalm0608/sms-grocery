import { prisma, hasPostgresDb } from '../db';
import { getLocalDb, saveLocalDb, SupplierMock } from './jsonDb';

export interface SupplierInput {
  name: string;
  contactNumber: string;
  address?: string;
}

export const suppliersService = {
  async getAllSuppliers() {
    if (hasPostgresDb) {
      return await prisma.supplier.findMany({
        orderBy: { name: 'asc' }
      });
    } else {
      const db = getLocalDb();
      return db.suppliers.sort((a, b) => a.name.localeCompare(b.name));
    }
  },

  async createSupplier(input: SupplierInput) {
    if (hasPostgresDb) {
      return await prisma.supplier.create({
        data: {
          name: input.name,
          contactNumber: input.contactNumber,
          address: input.address || null
        }
      });
    } else {
      const db = getLocalDb();
      // Check duplicate name
      if (db.suppliers.some(s => s.name.toLowerCase() === input.name.toLowerCase())) {
        throw new Error('Supplier name already exists');
      }
      
      const newSupplier: SupplierMock = {
        id: `sup-${Math.random().toString(36).substr(2, 9)}`,
        name: input.name,
        contactNumber: input.contactNumber,
        address: input.address || '',
        createdAt: new Date().toISOString()
      };
      
      db.suppliers.push(newSupplier);
      saveLocalDb(db);
      return newSupplier;
    }
  },

  async updateSupplier(id: string, input: Partial<SupplierInput>) {
    if (hasPostgresDb) {
      return await prisma.supplier.update({
        where: { id },
        data: {
          name: input.name,
          contactNumber: input.contactNumber,
          address: input.address
        }
      });
    } else {
      const db = getLocalDb();
      const idx = db.suppliers.findIndex(s => s.id === id);
      if (idx === -1) throw new Error('Supplier not found');
      
      const updated = {
        ...db.suppliers[idx],
        name: input.name !== undefined ? input.name : db.suppliers[idx].name,
        contactNumber: input.contactNumber !== undefined ? input.contactNumber : db.suppliers[idx].contactNumber,
        address: input.address !== undefined ? (input.address || '') : db.suppliers[idx].address
      };
      
      db.suppliers[idx] = updated;
      saveLocalDb(db);
      return updated;
    }
  },

  async deleteSupplier(id: string) {
    if (hasPostgresDb) {
      return await prisma.supplier.delete({
        where: { id }
      });
    } else {
      const db = getLocalDb();
      const idx = db.suppliers.findIndex(s => s.id === id);
      if (idx === -1) throw new Error('Supplier not found');
      
      const deleted = db.suppliers[idx];
      db.suppliers.splice(idx, 1);
      saveLocalDb(db);
      return deleted;
    }
  }
};
