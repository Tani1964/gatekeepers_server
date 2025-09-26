import { Game } from "../../models/Game";
import { User } from "../../models/User";

export class GameController {
  async getUpcomingGames(req: any, res: any) {
    try {
      const now = new Date();
      const todayString = now.toISOString().split("T")[0]; // Format: YYYY-MM-DD

      console.log("Current date/time:", now);
      console.log("Today as string:", todayString);

      // Since startDate is stored as string, we need to compare strings
      // Get all upcoming games, sorted by start date (closest first)
      const games = await Game.find({
        startDate: { $gte: todayString },
      }).sort({ startDate: 1 }); // Sort ascending to get closest first

      console.log("Upcoming games found:", games.length);
      console.log("Query criteria - looking for startDate >= ", todayString);

      // The closest game is always the first one in the sorted array
      const closestGame = games.length > 0 ? games[0] : null;

      res.status(200).json({
        success: true,
        data: games, // All games sorted with closest first
        closestGame: closestGame, // Explicitly provide the closest game
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
      const todayString = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD

      const games = await Game.find({
        players: userId,
        startDate: { $lt: todayString },
      }).sort({ startDate: -1 }); // Most recent first
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }
      // await user.updateOne({ monthlyDurationPlayed: user.monthlyDurationPlayed+, yearlyDurationPlayed: 0 });

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

      // Uncomment if you want to restrict access to players only
      // if (!game?.players.includes(id)) {
      //   return res.status(403).json({
      //     success: false,
      //     message: "You are not a player in this game",
      //   });
      // }

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

      // Extract data from request body (not params)
      const { user, game, gameId, score } = req.body;
      const userId = user?.id;

      console.log("Submitting score for user:", userId, "Score:", score);
      console.log("Game ID:", gameId);
      console.log("Game data:", game);

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

      foundGame.connectedUsers = foundGame.connectedUsers - 1;
      console.log(foundGame);
      // await foundGame.save();

      console.log("Found user:", foundUser.name);
      console.log("Found game:", foundGame.name);

      // Calculate duration played (you might want to get this from the game duration)
      // For now, I'll assume you want to use the game duration or a calculated value
      let durationPlayed = 0;

      if (game?.duration) {
        // If game duration is in minutes, convert to seconds
        durationPlayed = game.duration * 60;
      } else if (game?.durationInMinutes) {
        // If duration is in minutes, convert to seconds
        durationPlayed = game.durationInMinutes * 60;
      } else {
        // Fallback: calculate based on initial time minus remaining time
        // You might need to send the time played from frontend
        durationPlayed = 39; // Default initial time in seconds
      }

      console.log("Duration to add:", durationPlayed, "seconds");

      // Update user's playing time
      foundUser.monthlyDurationPlayed =
        (foundUser.monthlyDurationPlayed || 0) + durationPlayed;
      foundUser.yearlyDurationPlayed =
        (foundUser.yearlyDurationPlayed || 0) + durationPlayed;

      // Update user's score/eyes if needed
      foundUser.eyes -= 20 - score; // Uncomment if you want to store the score

      await foundUser.save();

      console.log("Score submitted successfully for user:", userId);
      console.log("Updated monthly duration:", foundUser.monthlyDurationPlayed);
      console.log("Updated yearly duration:", foundUser.yearlyDurationPlayed);

      res.status(200).json({
        success: true,
        message: "Score submitted successfully",
        data: {
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

  // Optional: Add a dedicated method to get only the closest game
  async getClosestGame(req: any, res: any) {
    try {
      const todayString = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD

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
