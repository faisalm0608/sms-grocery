import { NextRequest, NextResponse } from 'next/server';
import { suppliersService } from '@/lib/services/suppliers';

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

    const suppliers = await suppliersService.getAllSuppliers();
    return NextResponse.json(suppliers);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed to fetch suppliers' }, { status: 500 });
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
    const supplier = await suppliersService.createSupplier(body);
    return NextResponse.json(supplier, { status: 21 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed to create supplier' }, { status: 500 });
  }
}
