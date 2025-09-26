import crypto from "crypto";
import { OTP } from "../models/OTP";

export class OTPService {
  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async createOTP(
    email: string,
    purpose: "login" | "registration" | "password-reset" | "sensitive-operation"
  ) {
    await OTP.updateMany({ email, purpose, isUsed: false }, { isUsed: true });

    const otpCode = this.generateOTP();

    const otp = new OTP({
      email,
      otp: otpCode,
      purpose,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    await otp.save();

    await this.sendOTP(email, otpCode, purpose);

    return {
      success: true,
      message: `OTP sent to ${email}`,
      expiresIn: "10 minutes",
    };
  }

  async verifyOTP(email: string, otpCode: string, purpose: string) {
    const otp = await OTP.findOne({
      email,
      otp: otpCode,
      purpose,
      isUsed: false,
      expiresAt: { $gt: new Date() },
    });

    console.log('OTP verification attempt:', { email, otpCode, purpose });
    console.log('Found OTP record:', otp);

    if (!otp) {
      return {
        success: false,
        message: "Invalid or expired OTP",
      };
    }

    otp.isUsed = true;
    await otp.save();
    console.log('OTP record updated:', otp);

    return {
      success: true,
      message: "OTP verified successfully",
    };
  }

  private async sendOTP(email: string, otp: string, purpose: string) {
    console.log(`📱 Sending OTP to ${email}`);
    console.log(`🔑 Your ${purpose} OTP is: ${otp}`);
    console.log(`⏰ Valid for 10 minutes`);

    // In real app, you'd use:
    // - NodeMailer for email
    // - Twilio for SMS
    // - Firebase for push notifications
  }
}
