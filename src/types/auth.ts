import mongoose, { Document, Model, Schema } from "mongoose";
export interface IOTP extends Document {
  email: string;
  otp: string;
  expiresAt: Date;
  isUsed: boolean;
  purpose: 'login' | 'registration' | 'password-reset' | 'sensitive-operation';
  createdAt: Date;
}
