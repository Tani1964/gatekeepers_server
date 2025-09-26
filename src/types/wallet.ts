import mongoose, { Document, Schema } from 'mongoose';

export interface IWallet extends Document {
    userId: Schema.Types.ObjectId;
    balance: number;
    transactions: Array<{
        amount: number;
        type: "credit" | "debit";
        date: Date;
        status?: string,
        description?:string
        reference?:string
        transferCode?: string
    }>;
}