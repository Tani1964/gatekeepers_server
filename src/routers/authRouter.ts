import express from "express";
import { AuthController } from "../controllers/auth";

const router = express.Router();
const authController = new AuthController();

router.post("/register", (req:any, res:any) => authController.register(req, res));
router.post("/login", (req:any, res:any) => authController.initiateLogin(req, res));
router.post("/verify-otp", (req:any, res:any) =>
  authController.completeLogin(req, res)
);

router.get("/verify-token", (req:any, res:any) => authController.verifyToken(req, res));
router.post("/forgot-password", (req: any, res: any) => authController.initiateForgotPassword(req, res));
router.post("/verify-reset-otp", (req: any, res: any) => authController.verifyResetOTP(req, res));
router.post("/reset-password", (req: any, res: any) => authController.resetPassword(req, res));



export default router;
