import { Request, Response } from "express";
import { Wallet } from "../../models/Wallet";
import { PaystackWalletService } from "../../services/paystackWalletService";
import { User } from './../../models/User';

// Step 1: Initiate withdrawal (don't debit wallet yet)
export const initiateWithdrawal = async (req: Request, res: Response) => {
  try {
    const { 
      user, 
      amount, 
      account_number, 
      bank_code, 
      account_name,
      reason = "Wallet withdrawal" 
    } = req.body;

    // Validate required fields
    if (!user?.id || !amount || !account_number || !bank_code || !account_name) {
      return res.status(400).json({ 
        message: "Missing required fields" 
      });
    }

    // Find user's wallet
    const wallet = await Wallet.findOne({ userId: user.id });
    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    // Check sufficient funds
    if (wallet.balance < amount) {
      return res.status(400).json({ message: "Insufficient funds" });
    }

    try {
      // Verify account
      const accountVerification = await PaystackWalletService.verifyAccount(
        account_number, 
        bank_code
      );

      if (!accountVerification.status) {
        return res.status(400).json({ 
          message: "Invalid account details", 
          details: accountVerification 
        });
      }

      // Create recipient
      const recipient = await PaystackWalletService.createTransferRecipient(
        account_name,
        account_number,
        bank_code
      );

      if (!recipient.status) {
        return res.status(400).json({ 
          message: "Failed to create transfer recipient", 
          details: recipient 
        });
      }

      // Initiate transfer
      const transfer = await PaystackWalletService.initializeTransaction(
        amount,
        recipient.data.recipient_code,
        reason,
        `withdrawal_${user.id}_${Date.now()}`
      );

      if (!transfer.status) {
        return res.status(400).json({ 
          message: "Transfer failed", 
          details: transfer 
        });
      }

      console.log('Transfer initiated:', transfer.data);

      // Check if OTP is required
      const requiresOtp = transfer.data.status === "otp";

      // Store pending transaction (don't debit yet)
      wallet.transactions.push({ 
        amount, 
        type: "debit", 
        date: new Date(),
        reference: transfer.data.reference,
        status: "pending", // Mark as pending
        transferCode: transfer.data.transfer_code
      });

      await wallet.save();

      // Return response with OTP requirement
      res.json({
        message: requiresOtp 
          ? "OTP required to complete withdrawal" 
          : "Withdrawal initiated successfully",
        requiresOtp,
        transferCode: transfer.data.transfer_code,
        reference: transfer.data.reference,
        status: transfer.data.status,
        transfer: {
          amount: amount,
          recipient: accountVerification.data.account_name
        }
      });

    } catch (transferError: any) {
      console.error("Transfer error:", transferError);
      return res.status(500).json({ 
        message: "Transfer failed", 
        error: transferError.response?.data || transferError.message 
      });
    }

  } catch (error: any) {
    console.error("Wallet withdrawal error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Step 2: Finalize withdrawal with OTP
export const finalizeWithdrawal = async (req: Request, res: Response) => {
  try {
    const { userId, transferCode, otp } = req.body;

    if (!userId || !transferCode || !otp) {
      return res.status(400).json({ 
        message: "Missing required fields: userId, transferCode, otp" 
      });
    }

    // Find user's wallet
    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    try {
      // Finalize transfer with OTP

      const finalizeResult = await PaystackWalletService.finalizeTransfer(
        transferCode,
        otp
      );

      if (otp && !finalizeResult.status) {
        return res.status(400).json({ 
          message: "Failed to finalize transfer", 
          details: finalizeResult 
        });
      }

      // Verify the transfer was successful
      const verification = await PaystackWalletService.verifyTransaction(
        finalizeResult.data.reference
      );

      if (verification.data.status !== "success") {
        return res.status(400).json({ 
          message: "Transfer verification failed", 
          status: verification.data.status 
        });
      }

      // Find the pending transaction
      const transaction = wallet.transactions.find(
        t => t.transferCode === transferCode && t.status === "pending"
      );

      if (!transaction) {
        return res.status(404).json({ 
          message: "Pending transaction not found" 
        });
      }

      // NOW debit the wallet
      wallet.balance -= transaction.amount;
      transaction.status = "success";
      transaction.date = new Date();

      await wallet.save();

      res.json({
        message: "Withdrawal completed successfully",
        wallet: {
          balance: wallet.balance,
          userId: wallet.userId
        },
        transfer: {
          reference: verification.data.reference,
          status: verification.data.status,
          amount: transaction.amount
        }
      });

    } catch (finalizeError: any) {
      console.error("Finalize transfer error:", finalizeError);
      return res.status(500).json({ 
        message: "Failed to finalize transfer", 
        error: finalizeError.response?.data || finalizeError.message 
      });
    }

  } catch (error: any) {
    console.error("Finalize withdrawal error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Legacy function - keeping for backward compatibility
export const debitWallet = async (req: Request, res: Response) => {
  // Redirect to new initiate endpoint
  return initiateWithdrawal(req, res);
};

// Function to check transfer status
export const checkTransferStatus = async (req: Request, res: Response) => {
  try {
    const { transferCode } = req.params;

    const transferStatus = await PaystackWalletService.verifyTransaction(transferCode);

    res.json(transferStatus);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Function to get supported banks
export const getSupportedBanks = async (req: Request, res: Response) => {
  try {
    const banks = await PaystackWalletService.getBanks();
    res.json(banks);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Credit wallet function (unchanged)
export const creditWallet = async (req: Request, res: Response) => {
  try {
    const { userId, amount, numberOfEyes } = req.body;

    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.eyes += numberOfEyes;
    await user.save();

    wallet.balance += amount;
    wallet.transactions.push({ amount, type: "credit", date: new Date() });

    await wallet.save();

    res.json(wallet);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const verifyAccount = async (req: Request, res: Response) => {
  try {
    const { accountNumber, bankCode } = req.body;

    const verification = await PaystackWalletService.verifyAccount(accountNumber, bankCode);
    
    res.json(verification);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};