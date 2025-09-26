import { Request, Response } from "express";
import { Wallet } from "../../models/Wallet";

/**
 * Handles payment provider webhook
 */
export const handleWalletWebhook = async (req: Request, res: Response) => {
  try {
    // 1. Verify signature (important: depends on your payment provider)
    // Example for Paystack: compare req.headers["x-paystack-signature"]

    const event = req.body;

    // 2. Process event type
    if (event.event === "charge.success") {
      const { userId, amount } = event.data.metadata; // assuming you pass metadata in transaction

      // 3. Find wallet
      let wallet = await Wallet.findOne({ userId });
      if (!wallet) {
        return res.status(404).json({ success: false, message: "Wallet not found" });
      }

      // 4. Update wallet balance
      wallet.balance += amount;
      wallet.transactions.push({
        amount,
        type: "credit",
        date: new Date(),
      });

      await wallet.save();
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).json({ success: false, message: "Webhook handling failed" });
  }
};
