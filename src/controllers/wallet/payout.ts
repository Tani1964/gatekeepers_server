import { Request, Response } from "express";
import { Wallet } from "../../models/Wallet";
import { PaystackWalletService } from "../../services/paystackWalletService";
import { User } from './../../models/User';

// Updated debit wallet function
export const debitWallet = async (req: Request, res: Response) => {
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
        message: "Missing required fields: user, amount, account_number, bank_code, account_name" 
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
      // Step 1: Verify the account number first
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

      console.log('Account verified:', accountVerification.data);

      // Step 2: Create transfer recipient
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

      console.log('Recipient created:', recipient.data);

      // Step 3: Initiate the transfer
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

      // Step 4: Update wallet (only after successful transfer initiation)
      wallet.balance -= amount;
      wallet.transactions.push({ 
        amount, 
        type: "debit", 
        date: new Date(),
        reference: transfer.data.reference,
        status: transfer.data.status,
        transferCode: transfer.data.transfer_code
      });

      await wallet.save();

      res.json({
        message: "Withdrawal initiated successfully",
        wallet: {
          balance: wallet.balance,
          userId: wallet.userId
        },
        transfer: {
          reference: transfer.data.reference,
          status: transfer.data.status,
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
    console.error("Wallet debit error:", error);
    res.status(500).json({ message: error.message });
  }
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
}