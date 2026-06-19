import { NextRequest, NextResponse } from 'next/server';
import { productsService } from '@/lib/services/products';

export async function GET(req: NextRequest) {
  try {
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

    const txns = await productsService.getInventoryTxns();
    return NextResponse.json(txns);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed to fetch inventory transactions' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
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
    const { productId, quantity, type, reason } = body;

    if (!productId || !quantity || !type || !reason) {
      return NextResponse.json({ message: 'Missing adjustment fields' }, { status: 400 });
    }

    const result = await productsService.adjustStock(productId, quantity, type, reason);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed to adjust stock' }, { status: 500 });
  }
}
