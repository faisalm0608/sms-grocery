export interface ProductMock {
  id: string;
  barcode: string;
  name: string;
  image: string;
  description: string;
  category: string;
  purchasePrice: number;
  sellingPrice: number;
  stockQuantity: number;
  reorderLevel: number;
  supplierName: string;
  expiryDate: string;
  createdAt: string;
  updatedAt: string;
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
  customerName: string;
  customerMobile: string;
  customerAddress: string;
  pickupTime: string;
  totalAmount: number;
  tax: number;
  discount: number;
  status: 'PENDING' | 'ACCEPTED' | 'PACKING' | 'READY_FOR_PICKUP' | 'COMPLETED' | 'CANCELLED';
  paymentStatus: 'PENDING' | 'COMPLETED';
  upiTxnId?: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItemMock[];
}

export interface SupplierMock {
  id: string;
  name: string;
  contactNumber: string;
  address: string;
  createdAt: string;
}

export interface CustomerMock {
  mobileNumber: string;
  name: string;
  address: string;
  totalSpend: number;
  loyaltyPoints: number;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryTxnMock {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  type: 'STOCK_IN' | 'STOCK_OUT';
  reason: string;
  createdAt: string;
}

// Initial mock products
export const INITIAL_PRODUCTS: Omit<ProductMock, 'createdAt' | 'updatedAt'>[] = [
  // Fruits & Vegetables
  {
    id: 'prod-f&v-1',
    barcode: '8901234000010',
    name: 'Fresh Kashmiri Apples (Premium)',
    image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600&auto=format&fit=crop&q=60',
    description: 'Crisp, sweet, and handpicked premium Kashmiri apples. Rich in antioxidants.',
    category: 'Fruits & Vegetables',
    purchasePrice: 130,
    sellingPrice: 180,
    stockQuantity: 45,
    reorderLevel: 10,
    supplierName: 'Thanjavur Fresh Farm Traders',
    expiryDate: '2026-07-05'
  },
  {
    id: 'prod-f&v-2',
    barcode: '8901234000027',
    name: 'Organic Tomatoes (Local)',
    image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&auto=format&fit=crop&q=60',
    description: 'Farm-fresh organic red tomatoes, ideal for curries, salads, and sauces.',
    category: 'Fruits & Vegetables',
    purchasePrice: 20,
    sellingPrice: 35,
    stockQuantity: 8, // Low stock to trigger warnings
    reorderLevel: 15,
    supplierName: 'Thanjavur Fresh Farm Traders',
    expiryDate: '2026-06-25'
  },
  {
    id: 'prod-f&v-3',
    barcode: '8901234000034',
    name: 'Fresh Cavendish Bananas (Robusta)',
    image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&auto=format&fit=crop&q=60',
    description: 'Sweet, fully ripe yellow bananas. Excellent source of potassium.',
    category: 'Fruits & Vegetables',
    purchasePrice: 35,
    sellingPrice: 50,
    stockQuantity: 60,
    reorderLevel: 10,
    supplierName: 'Thanjavur Fresh Farm Traders',
    expiryDate: '2026-06-22'
  },
  {
    id: 'prod-f&v-4',
    barcode: '8901234000041',
    name: 'Organic Potatoes (Jyoti)',
    image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&auto=format&fit=crop&q=60', // Fallback or search
    description: 'Versatile potatoes sourced directly from farmers, stored under optimal conditions.',
    category: 'Fruits & Vegetables',
    purchasePrice: 18,
    sellingPrice: 28,
    stockQuantity: 120,
    reorderLevel: 30,
    supplierName: 'Thanjavur Fresh Farm Traders',
    expiryDate: '2026-08-10'
  },
  // Dairy, Bread & Eggs
  {
    id: 'prod-dairy-1',
    barcode: '8901262010043',
    name: 'Amul Butter 500g',
    image: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=600&auto=format&fit=crop&q=60',
    description: 'Utterly Butterly Delicious pasteurized salted butter from Amul.',
    category: 'Dairy, Bread & Eggs',
    purchasePrice: 220,
    sellingPrice: 275,
    stockQuantity: 25,
    reorderLevel: 8,
    supplierName: 'Amul Dairy Distributors',
    expiryDate: '2026-10-15'
  },
  {
    id: 'prod-dairy-2',
    barcode: '8901262020011',
    name: 'Amul Taaza Toned Milk 1L',
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=60',
    description: 'Homogenized toned long-life milk. No preservatives, needs no boiling.',
    category: 'Dairy, Bread & Eggs',
    purchasePrice: 60,
    sellingPrice: 72,
    stockQuantity: 50,
    reorderLevel: 15,
    supplierName: 'Amul Dairy Distributors',
    expiryDate: '2026-07-20'
  },
  {
    id: 'prod-dairy-3',
    barcode: '8901262020226',
    name: 'Amul Masti Spiced Buttermilk 200ml',
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=60',
    description: 'Refreshing spiced buttermilk with cumin, ginger, and green chillies.',
    category: 'Dairy, Bread & Eggs',
    purchasePrice: 12,
    sellingPrice: 15,
    stockQuantity: 80,
    reorderLevel: 20,
    supplierName: 'Amul Dairy Distributors',
    expiryDate: '2026-07-10'
  },
  {
    id: 'prod-dairy-4',
    barcode: '8901262030010',
    name: 'Fresh Farm Eggs (Pack of 6)',
    image: 'https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=600&auto=format&fit=crop&q=60',
    description: 'Farm-fresh, clean, high-protein white eggs from local poultry farms.',
    category: 'Dairy, Bread & Eggs',
    purchasePrice: 32,
    sellingPrice: 48,
    stockQuantity: 30,
    reorderLevel: 5,
    supplierName: 'Thanjavur Fresh Farm Traders',
    expiryDate: '2026-06-30'
  },
  // Munchies & Chips
  {
    id: 'prod-snack-1',
    barcode: '8902083011019',
    name: 'Lays Potato Chips - Magic Masala 50g',
    image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=600&auto=format&fit=crop&q=60',
    description: 'Crispy potato chips infused with the magical spices of India.',
    category: 'Munchies & Chips',
    purchasePrice: 16,
    sellingPrice: 20,
    stockQuantity: 110,
    reorderLevel: 20,
    supplierName: 'ITC Consumer Goods Ltd',
    expiryDate: '2026-11-30'
  },
  {
    id: 'prod-snack-2',
    barcode: '8902083011026',
    name: 'Kurkure Masala Munch 90g',
    image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=600&auto=format&fit=crop&q=60',
    description: 'Crunchy, tasty, and spicy puffed corn snack with traditional spices.',
    category: 'Munchies & Chips',
    purchasePrice: 24,
    sellingPrice: 30,
    stockQuantity: 3, // Very low stock/Out of stock warning
    reorderLevel: 15,
    supplierName: 'ITC Consumer Goods Ltd',
    expiryDate: '2026-12-15'
  },
  {
    id: 'prod-snack-3',
    barcode: '8901719101037',
    name: 'Britannia Good Day Cashew Biscuits 200g',
    image: 'https://images.unsplash.com/photo-1558961309-dbdf71798aff?w=600&auto=format&fit=crop&q=60',
    description: 'Rich, butter-baked cookies loaded with chopped cashew nuts.',
    category: 'Munchies & Chips',
    purchasePrice: 28,
    sellingPrice: 35,
    stockQuantity: 65,
    reorderLevel: 10,
    supplierName: 'ITC Consumer Goods Ltd',
    expiryDate: '2026-09-30'
  },
  // Cold Drinks & Juices
  {
    id: 'prod-drink-1',
    barcode: '5449000000996',
    name: 'Coca Cola Original Taste 1.25L',
    image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&auto=format&fit=crop&q=60',
    description: 'Refreshing, fizzy, and classic Coca Cola soft drink in a 1.25-litre bottle.',
    category: 'Cold Drinks & Juices',
    purchasePrice: 50,
    sellingPrice: 65,
    stockQuantity: 40,
    reorderLevel: 12,
    supplierName: 'ITC Consumer Goods Ltd',
    expiryDate: '2026-10-31'
  },
  {
    id: 'prod-drink-2',
    barcode: '8902083002017',
    name: 'Real Fruit Power Mixed Fruit Juice 1L',
    image: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=600&auto=format&fit=crop&q=60',
    description: 'Healthy and delicious mixed fruit juice made from nine premium fruits.',
    category: 'Cold Drinks & Juices',
    purchasePrice: 95,
    sellingPrice: 120,
    stockQuantity: 30,
    reorderLevel: 8,
    supplierName: 'ITC Consumer Goods Ltd',
    expiryDate: '2026-08-30'
  },
  {
    id: 'prod-drink-3',
    barcode: '8901764022127',
    name: 'Bisleri Mineral Water 1L',
    image: 'https://images.unsplash.com/photo-1608885898957-a599fb16ec35?w=600&auto=format&fit=crop&q=60',
    description: 'Ozoned and mineral-infused pure drinking water.',
    category: 'Cold Drinks & Juices',
    purchasePrice: 14,
    sellingPrice: 20,
    stockQuantity: 150,
    reorderLevel: 40,
    supplierName: 'Thanjavur Fresh Farm Traders',
    expiryDate: '2027-06-19'
  },
  // Rice, Atta & Dals
  {
    id: 'prod-grain-1',
    barcode: '8901499008234',
    name: 'Aashirvaad Shudh Chakki Atta 5kg',
    image: 'https://images.unsplash.com/photo-1574316071802-0d684efa7bf5?w=600&auto=format&fit=crop&q=60',
    description: '100% pure whole wheat stone-ground flour. Sourced from high quality crops.',
    category: 'Rice, Atta & Dals',
    purchasePrice: 210,
    sellingPrice: 260,
    stockQuantity: 35,
    reorderLevel: 8,
    supplierName: 'ITC Consumer Goods Ltd',
    expiryDate: '2026-09-20'
  },
  {
    id: 'prod-grain-2',
    barcode: '8906001290312',
    name: 'India Gate Basmati Rice Super 5kg',
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=60',
    description: 'Aged basmati rice with slender, long grains, perfect for biryanis and pulaos.',
    category: 'Rice, Atta & Dals',
    purchasePrice: 480,
    sellingPrice: 599,
    stockQuantity: 15,
    reorderLevel: 5,
    supplierName: 'ITC Consumer Goods Ltd',
    expiryDate: '2027-05-30'
  },
  {
    id: 'prod-grain-3',
    barcode: '8901499008555',
    name: 'Tata Sampann Premium Toor Dal 1kg',
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=60',
    description: 'Unpolished premium split pigeon peas. Cleaned, sorted, and packed hygienically.',
    category: 'Rice, Atta & Dals',
    purchasePrice: 140,
    sellingPrice: 185,
    stockQuantity: 40,
    reorderLevel: 10,
    supplierName: 'ITC Consumer Goods Ltd',
    expiryDate: '2026-12-31'
  },
  // Masalas & Spices
  {
    id: 'prod-spice-1',
    barcode: '8901058002315',
    name: 'Tata Salt Iodized 1kg',
    image: 'https://images.unsplash.com/photo-1594911774802-8822a707cbb3?w=600&auto=format&fit=crop&q=60',
    description: 'Pioneer of iodized salt in India, ensuring mental development and health.',
    category: 'Masalas & Spices',
    purchasePrice: 20,
    sellingPrice: 28,
    stockQuantity: 100,
    reorderLevel: 25,
    supplierName: 'ITC Consumer Goods Ltd',
    expiryDate: '2028-12-31'
  },
  {
    id: 'prod-spice-2',
    barcode: '8901297011039',
    name: 'MDH Deggi Mirch Powder 100g',
    image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&auto=format&fit=crop&q=60',
    description: 'A unique blend of mild red chillies providing rich red color and spice to curries.',
    category: 'Masalas & Spices',
    purchasePrice: 62,
    sellingPrice: 85,
    stockQuantity: 35,
    reorderLevel: 10,
    supplierName: 'Thanjavur Fresh Farm Traders',
    expiryDate: '2026-11-30'
  },
  {
    id: 'prod-spice-3',
    barcode: '8901297011220',
    name: 'MDH Garam Masala 100g',
    image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&auto=format&fit=crop&q=60',
    description: 'Traditional blend of spices to add aroma, depth, and flavor to vegetable and meat dishes.',
    category: 'Masalas & Spices',
    purchasePrice: 68,
    sellingPrice: 90,
    stockQuantity: 42,
    reorderLevel: 10,
    supplierName: 'Thanjavur Fresh Farm Traders',
    expiryDate: '2026-11-20'
  },
  // Personal Care
  {
    id: 'prod-care-1',
    barcode: '8901138836069',
    name: 'Colgate Strong Teeth Toothpaste 150g',
    image: 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=600&auto=format&fit=crop&q=60',
    description: 'Arginine-powered formula that seals calcium in teeth, making them stronger.',
    category: 'Personal Care',
    purchasePrice: 80,
    sellingPrice: 110,
    stockQuantity: 55,
    reorderLevel: 12,
    supplierName: 'Hindustan Unilever Distributor',
    expiryDate: '2028-05-19'
  },
  {
    id: 'prod-care-2',
    barcode: '8901030753006',
    name: 'Dettol Liquid Handwash Original 200ml',
    image: 'https://images.unsplash.com/photo-1603052875302-d376b7c0638a?w=600&auto=format&fit=crop&q=60',
    description: 'Original pine fragrance handwash with 99.9% germ protection formula.',
    category: 'Personal Care',
    purchasePrice: 78,
    sellingPrice: 99,
    stockQuantity: 28,
    reorderLevel: 8,
    supplierName: 'Hindustan Unilever Distributor',
    expiryDate: '2027-10-31'
  },
  {
    id: 'prod-care-3',
    barcode: '8901030656642',
    name: 'Lifebuoy Total 10 Soap Bar 125g',
    image: 'https://images.unsplash.com/photo-1603052875302-d376b7c0638a?w=600&auto=format&fit=crop&q=60',
    description: 'Advanced silver-shield formula soap bar, providing defense against infection.',
    category: 'Personal Care',
    purchasePrice: 28,
    sellingPrice: 38,
    stockQuantity: 70,
    reorderLevel: 15,
    supplierName: 'Hindustan Unilever Distributor',
    expiryDate: '2028-02-28'
  },
  // Household Essentials
  {
    id: 'prod-house-1',
    barcode: '8901030870932',
    name: 'Vim Dishwash Liquid Gel Lemon 500ml',
    image: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=600&auto=format&fit=crop&q=60',
    description: 'Super-degreasing dishwash gel with the power of 100 lemons. High efficiency.',
    category: 'Household Essentials',
    purchasePrice: 92,
    sellingPrice: 120,
    stockQuantity: 45,
    reorderLevel: 10,
    supplierName: 'Hindustan Unilever Distributor',
    expiryDate: '2027-09-30'
  },
  {
    id: 'prod-house-2',
    barcode: '8901030784260',
    name: 'Surf Excel Easy Wash Detergent 1kg',
    image: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=600&auto=format&fit=crop&q=60',
    description: 'Superfine powder that dissolves easily and removes tough stains in buckets.',
    category: 'Household Essentials',
    purchasePrice: 110,
    sellingPrice: 145,
    stockQuantity: 32,
    reorderLevel: 8,
    supplierName: 'Hindustan Unilever Distributor',
    expiryDate: '2028-03-31'
  },
  {
    id: 'prod-house-3',
    barcode: '8901243121010',
    name: 'Lizol Disinfectant Floor Cleaner Citrus 1L',
    image: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=600&auto=format&fit=crop&q=60',
    description: 'Citrus-scented floor cleaner, kills 99.9% of bacteria and leaves floor shiny clean.',
    category: 'Household Essentials',
    purchasePrice: 165,
    sellingPrice: 209,
    stockQuantity: 20,
    reorderLevel: 5,
    supplierName: 'Hindustan Unilever Distributor',
    expiryDate: '2028-01-31'
  }
];

export const INITIAL_SUPPLIERS: SupplierMock[] = [
  {
    id: 'sup-1',
    name: 'Thanjavur Fresh Farm Traders',
    contactNumber: '+91 9845012345',
    address: '12, New Fruit Market Road, Thanjavur, Tamil Nadu',
    createdAt: '2026-01-10T12:00:00Z'
  },
  {
    id: 'sup-2',
    name: 'Amul Dairy Distributors',
    contactNumber: '+91 9789054321',
    address: 'Block 4B, Industrial Area, Trichy, Tamil Nadu',
    createdAt: '2026-01-12T12:00:00Z'
  },
  {
    id: 'sup-3',
    name: 'ITC Consumer Goods Ltd',
    contactNumber: '+91 9944005511',
    address: 'SF-10, SIDCO Estate, Thanjavur, Tamil Nadu',
    createdAt: '2026-01-15T12:00:00Z'
  },
  {
    id: 'sup-4',
    name: 'Hindustan Unilever Distributor',
    contactNumber: '+91 9622883344',
    address: 'No 45, V.O.C Street, Manakarambai, Thanjavur, Tamil Nadu',
    createdAt: '2026-01-20T12:00:00Z'
  }
];

export const INITIAL_CUSTOMERS: CustomerMock[] = [
  {
    mobileNumber: '9788045564',
    name: 'Mohammad Ali Jinnah',
    address: '818, Tendral Nagar, Vennar Bank Post, Manakarambai, Thanjavur, Tamil Nadu',
    totalSpend: 7500,
    loyaltyPoints: 750,
    createdAt: '2026-02-01T08:30:00Z',
    updatedAt: '2026-06-18T10:20:00Z'
  },
  {
    mobileNumber: '9876543210',
    name: 'Ramesh Kumar',
    address: '22, South Street, Vennar Bank, Thanjavur',
    totalSpend: 2450,
    loyaltyPoints: 245,
    createdAt: '2026-03-14T09:15:00Z',
    updatedAt: '2026-06-15T18:40:00Z'
  },
  {
    mobileNumber: '9003322110',
    name: 'Suresh Raina',
    address: 'Sector 3, Tendral Nagar, Thanjavur',
    totalSpend: 1100,
    loyaltyPoints: 110,
    createdAt: '2026-05-10T14:50:00Z',
    updatedAt: '2026-06-10T12:30:00Z'
  },
  {
    mobileNumber: '9150060800',
    name: 'Anjali Sharma',
    address: 'A-15, Manakarambai, Thanjavur',
    totalSpend: 450,
    loyaltyPoints: 45,
    createdAt: '2026-06-01T11:00:00Z',
    updatedAt: '2026-06-17T17:15:00Z'
  }
];

// Generate past order history for the last 30 days
export function generatePastOrders(products: any[]): OrderMock[] {
  const orders: OrderMock[] = [];
  const statusOptions: OrderMock['status'][] = ['COMPLETED'];
  const customers = INITIAL_CUSTOMERS;
  
  // Set date ranges for the last 30 days
  const now = new Date();
  
  // Let's create an order for each day
  for (let i = 30; i >= 1; i--) {
    const orderDate = new Date();
    orderDate.setDate(now.getDate() - i);
    orderDate.setHours(9 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 60), 0);
    
    const customer = customers[Math.floor(Math.random() * customers.length)];
    
    // Choose 1 to 4 random products
    const itemCount = 1 + Math.floor(Math.random() * 4);
    const selectedItems: OrderItemMock[] = [];
    let totalAmount = 0;
    
    const shuffledProducts = [...products].sort(() => 0.5 - Math.random());
    for (let j = 0; j < itemCount; j++) {
      const prod = shuffledProducts[j];
      const qty = 1 + Math.floor(Math.random() * 3);
      selectedItems.push({
        id: `item-${i}-${j}`,
        productId: prod.id,
        productName: prod.name,
        quantity: qty,
        purchasePrice: prod.purchasePrice,
        sellingPrice: prod.sellingPrice
      });
      totalAmount += prod.sellingPrice * qty;
    }
    
    const discount = totalAmount > 500 ? Math.floor(totalAmount * 0.05) : 0; // 5% discount for orders > 500
    const tax = Math.round((totalAmount - discount) * 0.05 * 100) / 100; // 5% tax
    const finalAmount = totalAmount - discount + tax;
    
    orders.push({
      id: `SMS-${orderDate.getFullYear()}${(orderDate.getMonth() + 1).toString().padStart(2, '0')}${orderDate.getDate().toString().padStart(2, '0')}-${1000 + i}`,
      customerName: customer.name,
      customerMobile: customer.mobileNumber,
      customerAddress: customer.address || 'Address',
      pickupTime: '05:00 PM - 07:00 PM',
      totalAmount: Math.round(finalAmount * 100) / 100,
      tax: tax,
      discount: discount,
      status: 'COMPLETED',
      paymentStatus: 'COMPLETED',
      upiTxnId: `UPI-${100000000000 + i + Math.floor(Math.random() * 10000000)}`,
      createdAt: orderDate.toISOString(),
      updatedAt: orderDate.toISOString(),
      items: selectedItems
    });
  }
  
  // Add 3 active (pending/accepted/packing/ready) orders for today
  const orderStates: OrderMock['status'][] = ['PENDING', 'ACCEPTED', 'READY_FOR_PICKUP'];
  const today = new Date();
  
  orderStates.forEach((state, idx) => {
    const orderDate = new Date();
    orderDate.setHours(today.getHours() - (idx + 1), Math.floor(Math.random() * 60), 0);
    
    const customer = customers[idx % customers.length];
    
    // Choose 2 random products
    const selectedItems: OrderItemMock[] = [];
    let totalAmount = 0;
    
    for (let j = 0; j < 2; j++) {
      const prod = products[j];
      const qty = 1 + j;
      selectedItems.push({
        id: `item-active-${idx}-${j}`,
        productId: prod.id,
        productName: prod.name,
        quantity: qty,
        purchasePrice: prod.purchasePrice,
        sellingPrice: prod.sellingPrice
      });
      totalAmount += prod.sellingPrice * qty;
    }
    
    const tax = Math.round(totalAmount * 0.05 * 100) / 100;
    const finalAmount = totalAmount + tax;
    
    orders.push({
      id: `SMS-${orderDate.getFullYear()}${(orderDate.getMonth() + 1).toString().padStart(2, '0')}${orderDate.getDate().toString().padStart(2, '0')}-${2000 + idx}`,
      customerName: customer.name,
      customerMobile: customer.mobileNumber,
      customerAddress: customer.address || 'Address',
      pickupTime: '06:00 PM - 08:00 PM',
      totalAmount: Math.round(finalAmount * 100) / 100,
      tax: tax,
      discount: 0,
      status: state,
      paymentStatus: state === 'READY_FOR_PICKUP' ? 'COMPLETED' : 'PENDING',
      upiTxnId: state === 'READY_FOR_PICKUP' ? `UPI-${500000000000 + idx}` : undefined,
      createdAt: orderDate.toISOString(),
      updatedAt: orderDate.toISOString(),
      items: selectedItems
    });
  });
  
  return orders;
}
