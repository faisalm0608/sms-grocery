import { db } from '../firebase';
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc 
} from 'firebase/firestore';

export interface Customer {
  id: string;
  mobileNumber: string;
  name: string;
  address?: string;
  totalSpend: number;
  loyaltyPoints: number;
  createdAt: string;
  updatedAt: string;
}

export const customersService = {
  async getAllCustomers() {
    try {
      const querySnapshot = await getDocs(collection(db, "customers"));
      const customers: Customer[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        customers.push({
          id: doc.id,
          mobileNumber: data.mobileNumber || doc.id,
          name: data.name || 'Valued Customer',
          address: data.address || '',
          totalSpend: data.totalSpend || 0,
          loyaltyPoints: data.loyaltyPoints || 0,
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString()
        });
      });
      // Sort by LTV (totalSpend) descending
      return customers.sort((a, b) => b.totalSpend - a.totalSpend);
    } catch (e) {
      console.error("Firestore getAllCustomers error:", e);
      return [];
    }
  },

  async getCustomerByMobile(mobile: string) {
    try {
      const cleaned = mobile.replace(/\D/g, '');
      const docRef = doc(db, "customers", cleaned);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          mobileNumber: data.mobileNumber || docSnap.id,
          name: data.name || 'Valued Customer',
          address: data.address || '',
          totalSpend: data.totalSpend || 0,
          loyaltyPoints: data.loyaltyPoints || 0,
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString()
        } as Customer;
      }
      return null;
    } catch (e) {
      console.error("Firestore getCustomerByMobile error:", e);
      return null;
    }
  },

  async createOrUpdateCustomer(mobile: string, name: string, address?: string) {
    try {
      const cleaned = mobile.replace(/\D/g, '');
      const docRef = doc(db, "customers", cleaned);
      const docSnap = await getDoc(docRef);
      const now = new Date().toISOString();
      
      if (docSnap.exists()) {
        const existingData = docSnap.data();
        const updatedData = {
          name,
          address: address || existingData.address || '',
          updatedAt: now
        };
        await updateDoc(docRef, updatedData);
        return {
          id: cleaned,
          mobileNumber: cleaned,
          name,
          address: address || existingData.address || '',
          totalSpend: existingData.totalSpend || 0,
          loyaltyPoints: existingData.loyaltyPoints || 0,
          createdAt: existingData.createdAt || now,
          updatedAt: now
        } as Customer;
      } else {
        const newData = {
          id: cleaned,
          mobileNumber: cleaned,
          name: name || 'Valued Customer',
          address: address || '',
          totalSpend: 0,
          loyaltyPoints: 0,
          createdAt: now,
          updatedAt: now
        };
        await setDoc(docRef, newData);
        return newData as Customer;
      }
    } catch (e) {
      console.error("Firestore createOrUpdateCustomer error:", e);
      throw e;
    }
  }
};
