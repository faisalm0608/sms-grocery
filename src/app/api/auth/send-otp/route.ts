import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/lib/services/auth';

export async function POST(req: NextRequest) {
  try {
    const { mobileNumber } = await req.json();
    if (!mobileNumber) {
      return NextResponse.json({ message: 'Mobile number is required' }, { status: 400 });
    }

    const result = await authService.sendOtp(mobileNumber);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed to send OTP' }, { status: 500 });
  }
}
