import { NextRequest, NextResponse } from 'next/server';
import { productsService } from '@/lib/services/products';

export async function GET(req: NextRequest) {
  try {
    const products = await productsService.getAllProducts();
    
    // Safety check: Filter out purchasePrice for customers if requested via a customer flag,
    // or by default, if no valid admin session cookie is found!
    // But since Next.js Pages/API can read cookies, let's check if the user is authorized as admin.
    const sessionCookie = req.cookies.get('sms_session')?.value;
    let isAdmin = false;
    
    if (sessionCookie) {
      try {
        const session = JSON.parse(atob(sessionCookie));
        isAdmin = session.role === 'ADMIN';
      } catch (e) {}
    }

    // Customer security: Customers MUST NEVER see purchasePrice, supplierCost, etc.
    if (!isAdmin) {
      const customerSafeProducts = products.map((p: any) => {
        const { purchasePrice, ...safeProduct } = p;
        return safeProduct;
      });
      return NextResponse.json(customerSafeProducts);
    }

    return NextResponse.json(products);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const product = await productsService.createProduct(body);
    return NextResponse.json(product, { status: 21 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed to create product' }, { status: 500 });
  }
}
