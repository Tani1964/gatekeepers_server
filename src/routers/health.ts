import express from "express";
import { healthCheck } from "../controllers/healthCheck";

const router = express.Router();

router.get("/", healthCheck);

export default router;
