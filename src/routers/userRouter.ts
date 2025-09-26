import express from "express";
import { UserController } from "../controllers/user/index";

const router = express.Router();
const userController = new UserController();


router.get("/:id", (req, res) => userController.getUser(req, res));
router.put("/:id", (req, res) => userController.updateUser(req, res));
router.delete("/:id", (req, res) => userController.deleteUser(req, res));
router.get("/monthly-leaderboard/:id", (req, res) => userController.getMonthlyLeaderboard(req, res));
router.get("/yearly-leaderboard/:id", (req, res) => userController.getYearlyLeaderboard(req, res));

export default router;
