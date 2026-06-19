import { prisma, hasPostgresDb } from '../db';
import { getLocalDb, saveLocalDb, CustomerMock } from './jsonDb';

export const customersService = {
  async getAllCustomers() {
    if (hasPostgresDb) {
      return await prisma.customer.findMany({
        orderBy: { totalSpend: 'desc' }
      });
    } else {
      const db = getLocalDb();
      return db.customers.sort((a, b) => b.totalSpend - a.totalSpend);
    }
  },

  async getCustomerByMobile(mobile: string) {
    if (hasPostgresDb) {
      return await prisma.customer.findUnique({
        where: { mobileNumber: mobile }
      });
    } else {
      const db = getLocalDb();
      return db.customers.find(c => c.mobileNumber === mobile) || null;
    }
  },

  async createOrUpdateCustomer(mobile: string, name: string, address?: string) {
    const now = new Date();
    if (hasPostgresDb) {
      return await prisma.customer.upsert({
        where: { mobileNumber: mobile },
        update: {
          name,
          address: address || null,
          updatedAt: now
        },
        create: {
          mobileNumber: mobile,
          name,
          address: address || null,
          totalSpend: 0,
          loyaltyPoints: 0
        }
      });
    } else {
      const db = getLocalDb();
      const idx = db.customers.findIndex(c => c.mobileNumber === mobile);
      if (idx !== -1) {
        db.customers[idx].name = name;
        if (address) db.customers[idx].address = address;
        db.customers[idx].updatedAt = now.toISOString();
        saveLocalDb(db);
        return db.customers[idx];
      } else {
        const newCustomer: CustomerMock = {
          mobileNumber: mobile,
          name,
          address: address || '',
          totalSpend: 0,
          loyaltyPoints: 0,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString()
        };
        db.customers.push(newCustomer);
        saveLocalDb(db);
        return newCustomer;
      }
    }
  }
};
