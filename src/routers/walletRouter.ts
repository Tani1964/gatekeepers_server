// import { getSupportedBanks } from './../controllers/wallet/payout';
import { Router } from "express";
import { createWallet, getTransactions, getWallet } from "../controllers/wallet/index";
import { checkTransferStatus, creditWallet, debitWallet, getSupportedBanks, verifyAccount } from "../controllers/wallet/payout";
import { handleWalletWebhook } from "../controllers/wallet/webhook";

const router = Router();


// Transactions
router.get("/transactions", getTransactions);
router.get("/:userId", getWallet);

// Payouts
router.post("/credit", creditWallet);
router.post("/debit", debitWallet);

router.get("/banks", getSupportedBanks);
router.post("/verify/:transferCode", checkTransferStatus);

router.post("/verify-account", verifyAccount);

// Webhook
router.post("/webhook", handleWalletWebhook);

export default router;
