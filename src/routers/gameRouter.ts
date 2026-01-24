import express from "express";
import { GameController } from "./../controllers/game/index";

const router = express.Router();
const gameController = new GameController();

// Game session endpoints
router.get("/", (req: any, res: any) =>
  gameController.getUpcomingGames(req, res),
);
router.get("/games/:id", (req: any, res: any) =>
  gameController.getGame(req, res),
);
router.get("/games/history", (req: any, res: any) =>
  gameController.getPastGames(req, res),
);
router.post("/submit-score", (req: any, res: any) =>
  gameController.submitScore(req, res),
);
router.post("/join", (req: any, res: any) => gameController.joinGame(req, res));
router.post("/leave", (req: any, res: any) =>
  gameController.leaveGame(req, res),
);
router.post("/lose", (req: any, res: any) => gameController.loseGame(req, res));
router.post("/debit-eyes", (req: any, res: any) =>
  gameController.debitEyes(req, res),
);
router.post("/end", (req: any, res: any) =>
  gameController.endGameAndDistributePrize(req, res),
);

export default router;
