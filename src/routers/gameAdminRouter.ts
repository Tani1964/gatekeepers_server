import express from "express";
import { GameAdminController } from "../controllers/game/admin";

const router = express.Router();
const gameAdminController = new GameAdminController();

router.post('/games', (req:any, res:any) => gameAdminController.createGame(req, res));
router.put('/games/:id', (req:any, res:any) => gameAdminController.updateGame(req, res));
router.delete('/games/:id', (req:any, res:any) => gameAdminController.deleteGame(req, res));
router.get('/games/:id', (req:any, res:any) => gameAdminController.getGame(req, res));
router.get('/my-games/:id', (req:any, res:any) => gameAdminController.getMyGames(req, res));

export default router;