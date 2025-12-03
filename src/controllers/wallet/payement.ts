// controllers/payments.ts
import crypto from "crypto";
import { Request, Response } from "express";
import { User } from "../../models/User";
import { Wallet } from "../../models/Wallet";
import { PaystackPaymentService } from "../../services/paystackPaymentService";

/**
 * Initialize payment for eyes purchase
 */
export const initializePayment = async (req: Request, res: Response) => {
  try {
    const { email, amount, metadata } = req.body;

    // Validate required fields
    if (!email || !amount || !metadata?.eyes || !metadata?.userId) {
      return res.status(400).json({
        message: "Missing required fields: email, amount, metadata (eyes, userId)"
      });
    }

    // Verify user exists
    const user = await User.findById(metadata.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Initialize payment with Paystack
    const paymentData = await PaystackPaymentService.initializePayment({
      email,
      amount: amount, // Convert to kobo
      metadata: {
        ...metadata,
        type: "eyes_purchase",
        customer_name: user.name,
      },
      callback_url: `${process.env.FRONTEND_URL}/payment-callback`,
    });

    if (!paymentData.status) {
      return res.status(400).json({
        message: "Failed to initialize payment",
        details: paymentData
      });
    }

    // Store pending transaction in wallet
    const wallet = await Wallet.findOne({ userId: metadata.userId });
    if (wallet) {
      wallet.transactions.push({
        amount: amount,
        type: "credit",
        status: "pending",
        reference: paymentData.data.reference,
        description: `Purchase of ${metadata.eyes} eyes`,
        date: new Date(),
      });
      await wallet.save();
    }

    res.json({
      status: true,
      message: "Payment initialized successfully",
      reference: paymentData.data.reference,
      authorization_url: paymentData.data.authorization_url,
      access_code: paymentData.data.access_code,
    });

  } catch (error: any) {
    console.error("Initialize payment error:", error);
    res.status(500).json({
      message: "Failed to initialize payment",
      error: error.response?.data || error.message
    });
  }
};

/**
 * Verify payment and credit user's eyes
 */
export const verifyPayment = async (req: Request, res: Response) => {
  try {
    const { reference } = req.params;

    if (!reference) {
      return res.status(400).json({ message: "Payment reference is required" });
    }

    // Verify payment with Paystack
    const verification = await PaystackPaymentService.verifyPayment(reference);

    if (!verification.status) {
      return res.status(400).json({
        message: "Payment verification failed",
        details: verification
      });
    }

    const paymentData = verification.data;

    // Check if payment was successful
    if (paymentData.status !== "success") {
      return res.status(400).json({
        status: "failed",
        message: "Payment was not successful",
        paymentStatus: paymentData.status
      });
    }

    // Check if payment has already been processed
    const userId = paymentData.metadata.userId;
    const wallet = await Wallet.findOne({ userId });
    
    if (wallet) {
      const existingTransaction = wallet.transactions.find(
        (t) => t.reference === reference && t.status === "success"
      );

      if (existingTransaction) {
        return res.status(400).json({
          status: "already_processed",
          message: "This payment has already been processed"
        });
      }
    }

    // Credit user's eyes
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const eyesToCredit = paymentData.metadata.eyes;
    user.eyes += eyesToCredit;
    await user.save();

    // Update wallet transaction
    if (wallet) {
      const transaction = wallet.transactions.find(
        (t) => t.reference === reference
      );

      if (transaction) {
        transaction.status = "success";
      } else {
        // If transaction wasn't stored during initialization
        wallet.transactions.push({
          amount: paymentData.amount / 100, // Convert from kobo
          type: "credit",
          status: "success",
          reference: reference,
          description: `Purchase of ${eyesToCredit} eyes`,
          date: new Date(),
        });
      }
      await wallet.save();
    }

    res.json({
      status: "success",
      message: "Payment verified and eyes credited successfully",
      data: {
        reference: reference,
        amount: paymentData.amount / 100,
        eyesCredited: eyesToCredit,
        newBalance: user.eyes,
        transactionDate: paymentData.paid_at || new Date(),
      }
    });

  } catch (error: any) {
    console.error("Verify payment error:", error);
    res.status(500).json({
      message: "Failed to verify payment",
      error: error.response?.data || error.message
    });
  }
};

/**
 * Get payment history for a user
 */
export const getPaymentHistory = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    // Filter for payment transactions only (credits with references)
    const payments = wallet.transactions
      .filter((t) => t.type === "credit" && t.reference)
      .sort((a, b) => b.date.getTime() - a.date.getTime());

    res.json({
      status: true,
      data: payments,
      total: payments.length
    });

  } catch (error: any) {
    console.error("Get payment history error:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Webhook handler for Paystack payment events
 */
export const handlePaymentWebhook = async (req: Request, res: Response) => {
  try {
    const hash = req.headers["x-paystack-signature"] as string;
    const secret = process.env.PAYSTACK_SECRET_KEY;

    if (!secret) {
      console.error("PAYSTACK_SECRET_KEY is not set");
      return res.status(500).json({ message: "Server configuration error" });
    }

    // Verify webhook signature
    const computedHash = crypto
      .createHmac("sha512", secret)
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (hash !== computedHash) {
      console.error("Invalid webhook signature");
      return res.status(401).json({ message: "Invalid signature" });
    }

    const event = req.body;

    // Handle charge.success event
    if (event.event === "charge.success") {
      const { reference, metadata, amount, status } = event.data;

      console.log("Processing charge.success event:", {
        reference,
        metadata,
        amount,
        status
      });

      // Only process if it's an eyes purchase
      if (metadata?.type === "eyes_purchase" && status === "success") {
        const userId = metadata.userId;
        const eyesToCredit = parseInt(metadata.eyes);

        if (!userId || !eyesToCredit) {
          console.error("Missing userId or eyes in metadata");
          return res.status(400).json({ message: "Invalid metadata" });
        }

        // Credit user's eyes
        const user = await User.findById(userId);
        if (!user) {
          console.error(`User not found: ${userId}`);
          return res.status(404).json({ message: "User not found" });
        }

        // Add eyes to user account
        user.eyes = (user.eyes || 0) + eyesToCredit;
        await user.save();

        // Update wallet transaction status
        const wallet = await Wallet.findOne({ userId });
        if (wallet) {
          const transaction = wallet.transactions.find(
            (t) => t.reference === reference
          );

          if (transaction) {
            transaction.status = "success";
            await wallet.save();
            console.log(`Updated wallet transaction status for reference: ${reference}`);
          } else {
            console.warn(`Transaction not found in wallet for reference: ${reference}`);
          }
        } else {
          console.warn(`Wallet not found for user: ${userId}`);
        }

        console.log(`✓ Credited ${eyesToCredit} eyes to user ${userId}. New balance: ${user.eyes}`);
      }
    }

    // Always respond with 200 to acknowledge receipt
    res.status(200).json({ message: "Webhook received" });

  } catch (error: any) {
    console.error("Webhook error:", error);
    // Still return 200 to prevent Paystack from retrying
    res.status(200).json({ message: "Webhook processed with errors" });
  }
};