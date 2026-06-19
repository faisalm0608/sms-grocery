import { NextRequest, NextResponse } from 'next/server';
import { ordersService } from '@/lib/services/orders';

export async function GET(req: NextRequest, { params }: { params: any }) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;
    const order = await ordersService.getOrderById(id);
    
    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed to fetch order' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: any }) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;

    // Check session
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
    const { status, paymentStatus, upiTxnId } = body;

    let updatedOrder;
    if (status) {
      updatedOrder = await ordersService.updateOrderStatus(id, status);
    }
    if (paymentStatus) {
      updatedOrder = await ordersService.updatePaymentStatus(id, paymentStatus, upiTxnId);
    }

    if (!updatedOrder) {
      return NextResponse.json({ message: 'No updates provided' }, { status: 400 });
    }

    return NextResponse.json(updatedOrder);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed to update order' }, { status: 500 });
  }
}
