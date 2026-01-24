import { Game } from "../../models/Game";
import { User } from "../../models/User";
import { Wallet } from "../../models/Wallet";

// Helper to mark users who left/lost so they can't rejoin
const userGameStatus: Record<
  string,
  Record<string, "active" | "left" | "lost">
> = {};

export class GameController {
  // User joins a game
  async joinGame(req: any, res: any) {
    try {
      const userId = req.user.id;
      const { gameId } = req.body;
      const game = await Game.findById(gameId);
      if (!game)
        return res
          .status(404)
          .json({ success: false, message: "Game not found" });

      // Prevent rejoin if user left/lost
      if (
        userGameStatus[gameId]?.[userId] &&
        userGameStatus[gameId][userId] !== "active"
      ) {
        return res
          .status(403)
          .json({ success: false, message: "You cannot rejoin this game." });
      }

      if (!game.connectedUsersArray?.includes(userId)) {
        (game.connectedUsersArray ??= []).push(userId);
        game.connectedUsers += 1;
        await game.save();
        if (!userGameStatus[gameId]) userGameStatus[gameId] = {};
        userGameStatus[gameId][userId] = "active";
      }
      return res.status(200).json({
        success: true,
        message: "Joined game",
        connectedUsers: game.connectedUsers,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ success: false, message: "Internal server error", error });
    }
  }

  // User leaves a game
  async leaveGame(req: any, res: any) {
    try {
      const userId = req.user.id;
      const { gameId } = req.body;
      const game = await Game.findById(gameId);
      if (!game)
        return res
          .status(404)
          .json({ success: false, message: "Game not found" });

      const idx = game.connectedUsersArray?.indexOf(userId);
      if (idx !== undefined && idx !== -1) {
        game.connectedUsersArray!.splice(idx, 1);
        game.connectedUsers = Math.max(0, game.connectedUsers - 1);
        await game.save();
        if (!userGameStatus[gameId]) userGameStatus[gameId] = {};
        userGameStatus[gameId][userId] = "left";
      }
      return res.status(200).json({
        success: true,
        message: "Left game",
        connectedUsers: game.connectedUsers,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ success: false, message: "Internal server error", error });
    }
  }

  // User loses a game
  async loseGame(req: any, res: any) {
    try {
      const userId = req.user.id;
      const { gameId, eyesLost } = req.body;
      const game = await Game.findById(gameId);
      if (!game)
        return res
          .status(404)
          .json({ success: false, message: "Game not found" });

      const idx = game.connectedUsersArray?.indexOf(userId);
      if (idx !== undefined && idx !== -1) {
        game.connectedUsersArray!.splice(idx, 1);
        game.connectedUsers = Math.max(0, game.connectedUsers - 1);
        await game.save();
        if (!userGameStatus[gameId]) userGameStatus[gameId] = {};
        userGameStatus[gameId][userId] = "lost";
      }

      // Debit eyes from user's account
      if (eyesLost && eyesLost > 0) {
        const user = await User.findById(userId);
        if (user) {
          user.eyes = Math.max(0, user.eyes - eyesLost);
          await user.save();
          console.log(
            `Debited ${eyesLost} eyes from user ${userId}. Remaining eyes: ${user.eyes}`,
          );
        }
      }

      return res.status(200).json({
        success: true,
        message: "Marked as lost",
        connectedUsers: game.connectedUsers,
        eyesDebited: eyesLost || 0,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ success: false, message: "Internal server error", error });
    }
  }

  // Debit eyes immediately during gameplay
  async debitEyes(req: any, res: any) {
    try {
      const userId = req.user.id;
      const { gameId, eyesLost } = req.body;

      if (!eyesLost || eyesLost <= 0) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid eyes amount" });
      }

      const game = await Game.findById(gameId);
      if (!game) {
        return res
          .status(404)
          .json({ success: false, message: "Game not found" });
      }

      // Verify user is in the game
      if (
        !game.connectedUsersArray ||
        !game.connectedUsersArray.includes(userId)
      ) {
        return res
          .status(400)
          .json({ success: false, message: "User not in game" });
      }

      // Debit eyes from user's account
      const user = await User.findById(userId);
      if (user) {
        const previousEyes = user.eyes;
        user.eyes = Math.max(0, user.eyes - eyesLost); // Prevent negative eyes
        await user.save();
        console.log(
          `[Debit Eyes] Debited ${eyesLost} eyes from user ${userId}. Previous: ${previousEyes}, New: ${user.eyes}`,
        );
      }

      return res.status(200).json({
        success: true,
        message: "Eyes debited",
        eyesDebited: eyesLost,
        remainingEyes: user?.eyes || 0,
      });
    } catch (error) {
      console.error("[Debit Eyes] Error:", error);
      return res
        .status(500)
        .json({ success: false, message: "Error debiting eyes" });
    }
  }

  // End game and split prize among winners
  async endGameAndDistributePrize(req: any, res: any) {
    try {
      const { gameId, finalScore } = req.body;

      console.log(
        `🎁 [Prize Distribution] Starting prize distribution for game: ${gameId}, finalScore: ${finalScore}`,
      );

      const game = await Game.findById(gameId);
      if (!game)
        return res
          .status(404)
          .json({ success: false, message: "Game not found" });

      // Winners are those still in connectedUsersArray (survivors)
      const winners = game.connectedUsersArray || [];

      console.log(
        `[Prize Distribution] Game: ${game.title}, Total Prize: ${game.price}, Winners: ${winners.length}, Winners IDs: ${winners.join(", ")}`,
      );

      if (winners.length === 0) {
        console.log(
          `[Prize Distribution] No winners - prize pool of ${game.price} remains unclaimed`,
        );
        return res.status(200).json({
          success: true,
          message: "Game ended but no winners to distribute prize",
          eyesCredited: 0,
          finalScore: finalScore || 0,
          totalPrize: game.price,
          survivors: 0,
        });
      }

      // Check if prize has already been distributed
      if (game.prizeDistributed) {
        console.log(
          `[Prize Distribution] Prize already distributed for game ${gameId}`,
        );
        const prizePerWinner = Math.floor(game.price / winners.length);
        return res.status(200).json({
          success: true,
          message: "Prize already distributed to all winners",
          eyesCredited: prizePerWinner,
          finalScore: finalScore || 0,
          totalPrize: game.price,
          survivors: winners.length,
          alreadyDistributed: true,
        });
      }

      // Calculate prize per winner based on game price and number of survivors
      const prizePerWinner = Math.floor(game.price / winners.length);

      console.log(
        `[Prize Distribution] Prize per winner: ${prizePerWinner} (${game.price} / ${winners.length} survivors)`,
      );
      console.log(`[Prize Distribution] Winner IDs:`, winners);

      // Distribute prize to ALL winners - add to their wallet balance
      let distributionCount = 0;

      for (const winnerId of winners) {
        try {
          console.log(
            `[Prize Distribution] Processing winner: ${winnerId}, type: ${typeof winnerId}`,
          );

          // Get winner wallet by userId - same pattern as creditWallet function
          const wallet = await Wallet.findOne({ userId: winnerId });

          console.log(
            `[Prize Distribution] Wallet found:`,
            wallet ? `Yes (balance: ${wallet.balance})` : "No",
          );

          if (wallet) {
            const previousBalance = wallet.balance;

            // Credit wallet balance - exactly like creditWallet does
            wallet.balance += prizePerWinner;

            // Add transaction record - same pattern as creditWallet
            wallet.transactions.push({
              amount: prizePerWinner,
              type: "credit",
              description: `Prize for game ${game.title} (${winners.length} survivor${winners.length > 1 ? "s" : ""})`,
              status: "completed",
              date: new Date(),
            });

            await wallet.save();
            console.log(
              `[Prize Distribution] SUCCESS! Credited ${prizePerWinner} to wallet for user ${winnerId}. Previous: ${previousBalance}, New: ${wallet.balance}`,
            );
            distributionCount++;
          } else {
            console.warn(
              `[Prize Distribution] WALLET NOT FOUND for user ${winnerId} - Creating new wallet`,
            );

            // Create wallet if it doesn't exist
            const newWallet = new Wallet({
              userId: winnerId,
              balance: prizePerWinner,
              transactions: [
                {
                  amount: prizePerWinner,
                  type: "credit",
                  description: `Prize for game ${game.title} (${winners.length} survivor${winners.length > 1 ? "s" : ""})`,
                  status: "completed",
                  date: new Date(),
                },
              ],
            });
            await newWallet.save();
            console.log(
              `[Prize Distribution] Created new wallet for user ${winnerId} with balance: ${prizePerWinner}`,
            );
            distributionCount++;
          }
        } catch (err) {
          console.error(
            `[Prize Distribution] Error distributing to user ${winnerId}:`,
            err,
          );
        }
      }

      console.log(
        `[Prize Distribution] Successfully distributed prize to ${distributionCount}/${winners.length} winners`,
      );

      // Mark prize as distributed
      game.prizeDistributed = true;
      await game.save();

      return res.status(200).json({
        success: true,
        message: `Prize distributed: ${prizePerWinner} eyes to each of ${winners.length} winner${winners.length > 1 ? "s" : ""}`,
        eyesCredited: prizePerWinner,
        finalScore: finalScore || 0,
        totalPrize: game.price,
        survivors: winners.length,
        prizePerWinner,
        distributionCount,
      });
    } catch (error) {
      console.error("[Prize Distribution] Error:", error);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error", error });
    }
  }

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

      // Always fetch fresh game data from DB to get latest connectedUsersArray
      const freshGame = await Game.findById(
        foundGame._id || foundGame.id || gameId,
      );
      if (!freshGame) {
        return res.status(404).json({
          success: false,
          message: "Game not found in database",
        });
      }

      console.log("Found user:", foundUser.name);
      console.log("Found game:", freshGame.title);
      console.log("Fresh connectedUsersArray:", freshGame.connectedUsersArray);

      console.log("Time played", timePlayed);

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

      // Note: Eyes deduction/credit is now handled in loseGame and endGameAndDistributePrize endpoints
      // We don't modify eyes here to avoid double deduction/credit

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
