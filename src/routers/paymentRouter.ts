// routes/payments.ts
import { Router } from "express";
import {
    getPaymentHistory,
    handlePaymentWebhook,
    initializePayment,
    verifyPayment,
} from "../controllers/wallet/payement";

const router = Router();

/**
 * POST /api/payments/initialize
 * Initialize a payment for eyes purchase
 * Body: { email, amount, metadata: { userId, eyes } }
 */
router.post("/initialize", initializePayment);

/**
 * GET /api/payments/verify/:reference
 * Verify payment and credit user's eyes
 * Params: reference (Paystack transaction reference)
 */
router.get("/verify/:reference", verifyPayment);

/**
 * GET /api/payments/history/:userId
 * Get payment history for a user
 * Params: userId
 */
router.get("/history/:userId", getPaymentHistory);

/**
 * POST /api/payments/webhook
 * Webhook endpoint for Paystack payment events
 * This should be configured in your Paystack dashboard
 */
router.post("/webhook", handlePaymentWebhook);

export default router;