// import { getSupportedBanks } from './../controllers/wallet/payout';
import { Router } from "express";
import { createWallet, getTransactions, getWallet } from "../controllers/wallet/index";
import { checkTransferStatus, creditWallet, debitWallet, getSupportedBanks, verifyAccount } from "../controllers/wallet/payout";
import { handleWalletWebhook } from "../controllers/wallet/webhook";
// import { authMiddleware } from "../middleware/auth"; // if you want protection

const router = Router();

// router.use(authMiddleware);

// Wallet operations
// router.post("/create", createWallet);

// Transactions
router.get("/transactions", getTransactions);
// router.get("/transaction", ()=>console.log("Get transaction")); // temporary fix for error
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
