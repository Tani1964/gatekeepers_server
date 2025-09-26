import { Request, Response } from "express";
import mongoose from "mongoose";
import { Wallet } from "../../models/Wallet";

// ✅ Create wallet for a user (called on signup usually)
export const createWallet = async (req: any, res: any) => {
    try {
        console.log("Get transaction")
      // Check if wallet already exists
      const existingWallet = await Wallet.findOne({ userId: req.params.id });
      if (existingWallet) {
        return res.status(400).json({ error: "Wallet already exists" });
      }

      const wallet = new Wallet({
        userId: req.user.id,
        balance: 1000,
        transactions: [],
      });
      await wallet.save();
      res.status(201).json({ wallet });
    } catch (error) {
      console.error("Create wallet error:", error);
      res.status(500).json({ error: "Failed to create wallet" });
    }
  }

// ✅ Get wallet balance
export const getWallet = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    res.json(wallet);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
// Get paginated transactions
export const getTransactions = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, userId } = req.query;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    // ✅ Cast string userId to ObjectId
    const objectId = new mongoose.Types.ObjectId(userId as string);

    const wallet = await Wallet.findOne({ userId: objectId });
    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = pageNum * limitNum;

    // ✅ Sort newest first
    const sortedTransactions = [...wallet.transactions].sort(
      (a, b) => b.date.getTime() - a.date.getTime()
    );

    const transactions = sortedTransactions.slice(startIndex, endIndex);

    res.json({
      page: pageNum,
      limit: limitNum,
      totalTransactions: wallet.transactions.length,
      totalPages: Math.ceil(wallet.transactions.length / limitNum),
      data: transactions,
    });
  } catch (error: any) {
    console.error("🔥 Error in getTransactions:", error);
    res.status(500).json({ message: "Error fetching transactions", error: error.message });
  }
};