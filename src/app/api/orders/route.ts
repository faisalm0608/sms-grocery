import { NextRequest, NextResponse } from 'next/server';
import { ordersService } from '@/lib/services/orders';

export async function GET(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('sms_session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    let session;
    try {
      session = JSON.parse(atob(sessionCookie));
    } catch (e) {
      return NextResponse.json({ message: 'Invalid session' }, { status: 401 });
    }

    if (session.role === 'ADMIN') {
      const orders = await ordersService.getAllOrders();
      return NextResponse.json(orders);
    } else {
      const orders = await ordersService.getOrdersByCustomerMobile(session.mobile);
      return NextResponse.json(orders);
    }
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customerName, customerMobile, customerAddress, pickupTime, items, discount, tax, paymentStatus, upiTxnId } = body;

    if (!customerName || !customerMobile || !items || items.length === 0) {
      return NextResponse.json({ message: 'Missing required order fields' }, { status: 400 });
    }

    const order = await ordersService.createOrder({
      customerName,
      customerMobile: customerMobile.replace(/\D/g, ''),
      customerAddress,
      pickupTime,
      items,
      discount,
      tax,
      paymentStatus,
      upiTxnId
    });

    return NextResponse.json(order, { status: 21 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed to create order' }, { status: 500 });
  }
}
