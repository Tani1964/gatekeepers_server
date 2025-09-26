import express from "express";
import { GameController } from './../controllers/game/index';

const router = express.Router();
const gameController = new GameController();

router.get('/',(req:any,res:any) => gameController.getUpcomingGames(req,res));
router.get('/games/:id', (req:any,res:any) => gameController.getGame(req,res));
router.get('/games/history', (req:any,res:any) => gameController.getPastGames(req,res));
router.post('/submit-score', (req:any,res:any) => gameController.submitScore(req,res))

export default router;