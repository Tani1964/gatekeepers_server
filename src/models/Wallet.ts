import mongoose, { Document, Schema } from 'mongoose';
import { IWallet } from '../types/wallet';

const WalletSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
  balance: { type: Number, default: 0 },
  transactions: [
    {
      amount: { type: Number, required: true },
      type: { type: String, enum: ["credit", "debit"], required: true },
      description: { type: String },               // ✅ Add this
      reference: { type: String },                 // ✅ Add this
      status: { type: String, default: "pending" },// ✅ Add this
      date: { type: Date, default: Date.now },
    },
  ],
});

export const Wallet = mongoose.model<IWallet>("Wallet", WalletSchema);