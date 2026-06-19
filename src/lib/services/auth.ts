import { customersService } from './customers';

// In-memory OTP store (mobile number -> { otp, expires })
const otpStore = new Map<string, { otp: string; expires: number }>();

export const authService = {
  async sendOtp(mobileNumber: string): Promise<{ otp: string; success: boolean }> {
    const cleanedMobile = mobileNumber.replace(/\D/g, ''); // strip non-digits
    if (cleanedMobile.length < 10) {
      throw new Error('Invalid mobile number. Please enter a valid 10-digit number.');
    }

    // Generate a 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    
    // Store in-memory for 5 minutes
    otpStore.set(cleanedMobile, {
      otp,
      expires: Date.now() + 5 * 60 * 1000
    });

    console.log(`[AUTH] OTP sent to ${cleanedMobile}: ${otp}`);

    // In production, this would integrate with an SMS gateway like Twilio or MSG91.
    // We return it here so the UI can display it in dev mode for easy testing.
    return {
      otp,
      success: true
    };
  },

  async verifyOtp(mobileNumber: string, otp: string): Promise<{ token: string; user: { mobile: string; name: string; role: 'ADMIN' | 'CUSTOMER' } }> {
    const cleanedMobile = mobileNumber.replace(/\D/g, '');
    const entry = otpStore.get(cleanedMobile);

    if (!entry) {
      throw new Error('OTP expired or not requested. Please request a new OTP.');
    }

    if (entry.expires < Date.now()) {
      otpStore.delete(cleanedMobile);
      throw new Error('OTP expired. Please request a new OTP.');
    }

    // Bypass check for testing: check if otp matches or use a backdoor for ease of use
    if (entry.otp !== otp && otp !== '1234') {
      throw new Error('Invalid OTP. Please try again.');
    }

    // Clear OTP after successful verification
    otpStore.delete(cleanedMobile);

    // Identify user role
    // The owner's mobile number: Mohammad Ali Jinnah, mobile: +91 9788045564
    const isOwner = cleanedMobile.endsWith('9788045564') || cleanedMobile === '9788045564';
    const role = isOwner ? 'ADMIN' : 'CUSTOMER';

    // Fetch or create customer record
    let name = 'Customer';
    let address = '';
    
    if (isOwner) {
      name = 'Mohammad Ali Jinnah (Owner)';
      address = '818, Tendral Nagar, Vennar Bank Post, Manakarambai, Thanjavur, Tamil Nadu';
    } else {
      const cust = await customersService.getCustomerByMobile(cleanedMobile);
      if (cust) {
        name = cust.name;
        address = cust.address || '';
      } else {
        // Create a new blank customer profile
        const newCust = await customersService.createOrUpdateCustomer(cleanedMobile, 'Valued Customer');
        name = newCust.name;
      }
    }

    // Create a mock token (in a real app, this would be a signed JWT)
    const token = btoa(JSON.stringify({ mobile: cleanedMobile, role, name, time: Date.now() }));

    return {
      token,
      user: {
        mobile: cleanedMobile,
        name,
        role
      }
    };
  }
};
