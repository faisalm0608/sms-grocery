import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/lib/services/auth';

export async function POST(req: NextRequest) {
  try {
    const { mobileNumber, otp } = await req.json();
    if (!mobileNumber || !otp) {
      return NextResponse.json({ message: 'Mobile number and OTP are required' }, { status: 400 });
    }

    const result = await authService.verifyOtp(mobileNumber, otp);
    
    const response = NextResponse.json({
      success: true,
      token: result.token,
      user: result.user
    });

    // Also set server-side HTTP-Only cookie for page-refresh session validation
    response.cookies.set('sms_session', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/'
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'OTP verification failed' }, { status: 401 });
  }
}
