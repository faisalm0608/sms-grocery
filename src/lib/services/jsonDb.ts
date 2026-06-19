import fs from 'fs';
import path from 'path';
import { 
  INITIAL_PRODUCTS, 
  INITIAL_SUPPLIERS, 
  INITIAL_CUSTOMERS, 
  generatePastOrders, 
  ProductMock, 
  OrderMock, 
  OrderItemMock,
  SupplierMock, 
  CustomerMock, 
  InventoryTxnMock 
} from './mockData';

export type { ProductMock, OrderMock, OrderItemMock, SupplierMock, CustomerMock, InventoryTxnMock };

const DB_FILE_PATH = path.join(process.cwd(), 'prisma', 'mock_db.json');

export interface LocalDbSchema {
  products: ProductMock[];
  orders: OrderMock[];
  suppliers: SupplierMock[];
  customers: CustomerMock[];
  inventoryTxns: InventoryTxnMock[];
}

function ensureDirExists(filePath: string) {
  const dirname = path.dirname(filePath);
  if (!fs.existsSync(dirname)) {
    fs.mkdirSync(dirname, { recursive: true });
  }
}

export function getLocalDb(): LocalDbSchema {
  try {
    ensureDirExists(DB_FILE_PATH);
    if (!fs.existsSync(DB_FILE_PATH)) {
      // Seed initial data
      const nowStr = new Date().toISOString();
      const products: ProductMock[] = INITIAL_PRODUCTS.map(p => ({
        ...p,
        createdAt: nowStr,
        updatedAt: nowStr
      }));
      const suppliers = [...INITIAL_SUPPLIERS];
      const customers = [...INITIAL_CUSTOMERS];
      const orders = generatePastOrders(products);
      
      // Calculate inventory transactions based on initial product stocks
      const inventoryTxns: InventoryTxnMock[] = products.map((p, idx) => ({
        id: `txn-init-${idx}`,
        productId: p.id,
        productName: p.name,
        quantity: p.stockQuantity,
        type: 'STOCK_IN',
        reason: 'INITIAL_STOCK_SEED',
        createdAt: nowStr
      }));

      const initialData: LocalDbSchema = {
        products,
        orders,
        suppliers,
        customers,
        inventoryTxns
      };

      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(initialData, null, 2), 'utf-8');
      return initialData;
    }

    const fileContent = fs.readFileSync(DB_FILE_PATH, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error('Failed to read or seed local JSON database:', error);
    // Return empty fallback
    return { products: [], orders: [], suppliers: [], customers: [], inventoryTxns: [] };
  }
}

export function saveLocalDb(data: LocalDbSchema) {
  try {
    ensureDirExists(DB_FILE_PATH);
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to write to local JSON database:', error);
  }
}
