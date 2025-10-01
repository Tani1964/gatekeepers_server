// services/otpService.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface OTPRecord {
  otp: string;
  expiresAt: Date;
  type: string;
}

export class OTPService {
  private otpStore: Map<string, OTPRecord> = new Map();

  generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async createOTP(email: string, type: string): Promise<void> {
    const otp = this.generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP
    this.otpStore.set(`${email}:${type}`, { otp, expiresAt, type });

    // Send OTP via email using Resend
    await this.sendOTPEmail(email, otp, type);

    console.log(`OTP created for ${email}: ${otp}`); // For development only
  }

  private async sendOTPEmail(email: string, otp: string, type: string): Promise<void> {
    try {
      let subject = 'Your OTP Code';
      let message = '';

      switch (type) {
        case 'login':
          subject = 'Your Login OTP Code';
          message = 'Use this OTP to complete your login:';
          break;
        case 'sensitive-operation':
          subject = 'Security Verification OTP';
          message = 'Use this OTP to verify your sensitive operation:';
          break;
        default:
          message = 'Your verification code is:';
      }

      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
        to: email,
        subject: subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Verification Code</h2>
            <p style="color: #666;">${message}</p>
            <div style="background-color: #f4f4f4; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <h1 style="color: #333; font-size: 32px; letter-spacing: 8px; margin: 0;">${otp}</h1>
            </div>
            <p style="color: #999; font-size: 14px;">This code will expire in 10 minutes.</p>
            <p style="color: #999; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
          </div>
        `
      });

      console.log(`OTP email sent successfully to ${email}`);
    } catch (error) {
      console.error('Failed to send OTP email:', error);
      throw new Error('Failed to send OTP email');
    }
  }

  async verifyOTP(email: string, otp: string, type: string): Promise<{ success: boolean; message: string }> {
    const key = `${email}:${type}`;
    const record = this.otpStore.get(key);

    if (!record) {
      return { success: false, message: 'OTP not found or expired' };
    }

    if (new Date() > record.expiresAt) {
      this.otpStore.delete(key);
      return { success: false, message: 'OTP has expired' };
    }

    if (record.otp !== otp) {
      return { success: false, message: 'Invalid OTP' };
    }

    // OTP is valid, remove it from store
    this.otpStore.delete(key);
    return { success: true, message: 'OTP verified successfully' };
  }

  // Clean up expired OTPs periodically
  cleanupExpiredOTPs(): void {
    const now = new Date();
    for (const [key, record] of this.otpStore.entries()) {
      if (now > record.expiresAt) {
        this.otpStore.delete(key);
      }
    }
  }
}