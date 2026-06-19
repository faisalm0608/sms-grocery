import { NextRequest, NextResponse } from 'next/server';
import { customersService } from '@/lib/services/customers';

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

    const customers = await customersService.getAllCustomers();
    return NextResponse.json(customers);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed to fetch customers' }, { status: 500 });
  }
}
