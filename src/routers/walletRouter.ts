// import { getSupportedBanks } from './../controllers/wallet/payout';
import { Router } from "express";
import { createWallet, getTransactions, getWallet } from "../controllers/wallet/index";
import { checkTransferStatus, creditWallet, debitWallet, finalizeWithdrawal, getAdWatchStatus, getSupportedBanks, initiateWithdrawal, recordAdWatch, verifyAccount } from "../controllers/wallet/payout";
import { handleWalletWebhook } from "../controllers/wallet/webhook";

const router = Router();

router.post("/initiate-withdrawal", initiateWithdrawal);
router.post("/finalize-withdrawal", finalizeWithdrawal);



// Transactions
router.get("/transactions", getTransactions);
router.get("/:userId", getWallet);

// Payouts
router.post("/credit", creditWallet);
router.post("/debit", debitWallet);

// Ad watching
router.post("/record-ad-watch", recordAdWatch);
router.get("/ad-watch-status/:userId", getAdWatchStatus);

router.get("/banks", getSupportedBanks);
router.post("/verify/:transferCode", checkTransferStatus);

router.post("/verify-account", verifyAccount);

// Webhook
router.post("/webhook", handleWalletWebhook);

export default router;
