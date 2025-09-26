import mongoose, { Document, Schema } from 'mongoose';
import { IOTP } from '../types/auth';


const otpSchema = new Schema<IOTP>({
  email: {
    type: String,
    required: true,
    lowercase: true
  },
  otp: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 10 * 60 * 1000) 
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  purpose: {
    type: String,
    enum: ['login', 'registration', 'password-reset', 'sensitive-operation'],
    required: true
  }
}, {
  timestamps: true
});

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const OTP = mongoose.model<IOTP>('OTP', otpSchema);