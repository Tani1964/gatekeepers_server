import { Game } from "../../models/Game";
import { User } from "../../models/User";

export class GameController {
  async getUpcomingGames(req: any, res: any) {
    try {
      const now = new Date();
      const todayString = now.toISOString().split("T")[0];

      console.log("Current date/time:", now);
      console.log("Today as string:", todayString);

      const games = await Game.find({
        startDate: { $gte: todayString },
      }).sort({ startDate: 1 });

      console.log("Upcoming games found:", games.length);
      console.log("Query criteria - looking for startDate >= ", todayString);

      const closestGame = games.length > 0 ? games[0] : null;

      res.status(200).json({
        success: true,
        data: games,
        closestGame: closestGame,
        hasGames: games.length > 0,
      });
    } catch (error) {
      console.error("Error fetching upcoming games:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async getPastGames(req: any, res: any) {
    try {
      console.log("Fetching past games for user", req.user);
      const userId = req.user.id;
      const todayString = new Date().toISOString().split("T")[0];

      const games = await Game.find({
        players: userId,
        startDate: { $lt: todayString },
      }).sort({ startDate: -1 });
      
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      res.status(200).json({
        success: true,
        data: games,
      });
    } catch (error) {
      console.error("Error fetching past games:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async getGame(req: any, res: any) {
    try {
      const { id } = req.params;

      const game = await Game.findById(id);

      if (!game) {
        return res.status(404).json({
          success: false,
          message: "Game not found",
        });
      }

      res.status(200).json({
        success: true,
        data: game,
      });
    } catch (error) {
      console.error("Error fetching game:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async submitScore(req: any, res: any) {
    try {
      console.log("Submit score request body:", req.body);

      const { user, game, gameId, score, timePlayed } = req.body;
      const userId = user?.id;

      console.log("Submitting score for user:", userId, "Score:", score);
      console.log("Game ID:", gameId);

      // Validate required fields
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "User ID is required",
        });
      }

      if (score === undefined || score === null) {
        return res.status(400).json({
          success: false,
          message: "Score is required",
        });
      }

      // Find the user
      const foundUser = await User.findById(userId);
      if (!foundUser) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const foundGame = game || (gameId ? await Game.findById(gameId) : null);
      if (!foundGame) {
        return res.status(404).json({
          success: false,
          message: "Game not found",
        });
      }

      console.log("Found user:", foundUser.name);
      console.log("Found game:", foundGame.title);

      console.log("Time played", timePlayed)

      // Calculate duration played
      let durationPlayed = timePlayed;

      // if (foundGame?.durationInMinutes) {
      //   durationPlayed = foundGame.durationInMinutes * 60;
      // } else {
      //   durationPlayed = 39; // Default initial time in seconds
      // }

      console.log("Duration to add:", durationPlayed, "seconds");

      // Update user's playing time
      foundUser.monthlyDurationPlayed =
        (foundUser.monthlyDurationPlayed || 0) + durationPlayed;
      foundUser.yearlyDurationPlayed =
        (foundUser.yearlyDurationPlayed || 0) + durationPlayed;

      // Update user's score/eyes if needed
      foundUser.eyes -= (20 - score);

      await foundUser.save();

      console.log("Score submitted successfully for user:", userId);
      console.log("Updated monthly duration:", foundUser.monthlyDurationPlayed);
      console.log("Updated yearly duration:", foundUser.yearlyDurationPlayed);

      res.status(200).json({
        success: true,
        message: "Score submitted successfully",
        data: {
          eyesLeft: foundUser.eyes,
          score: score,
          durationPlayed: durationPlayed,
          monthlyDurationPlayed: foundUser.monthlyDurationPlayed,
          yearlyDurationPlayed: foundUser.yearlyDurationPlayed,
        },
      });
    } catch (error) {
      console.error("Error submitting score:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error,
      });
    }
  }

  async getClosestGame(req: any, res: any) {
    try {
      const todayString = new Date().toISOString().split("T")[0];

      const closestGame = await Game.findOne({
        startDate: { $gte: todayString },
      }).sort({ startDate: 1 });

      if (!closestGame) {
        return res.status(404).json({
          success: false,
          message: "No upcoming games found",
        });
      }

      res.status(200).json({
        success: true,
        data: closestGame,
      });
    } catch (error) {
      console.error("Error fetching closest game:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
}