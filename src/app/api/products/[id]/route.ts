import { NextRequest, NextResponse } from 'next/server';
import { productsService } from '@/lib/services/products';

export async function GET(req: NextRequest, { params }: { params: any }) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;
    const product = await productsService.getProductById(id);
    
    if (!product) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }

    // Hide purchase price for customers
    const sessionCookie = req.cookies.get('sms_session')?.value;
    let isAdmin = false;
    if (sessionCookie) {
      try {
        const session = JSON.parse(atob(sessionCookie));
        isAdmin = session.role === 'ADMIN';
      } catch (e) {}
    }

    if (!isAdmin) {
      const { purchasePrice, ...safeProduct } = product as any;
      return NextResponse.json(safeProduct);
    }

    return NextResponse.json(product);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed to fetch product' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: any }) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;

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
    const updated = await productsService.updateProduct(id, body);
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: any }) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;

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

    const deleted = await productsService.deleteProduct(id);
    return NextResponse.json(deleted);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed to delete product' }, { status: 500 });
  }
}
