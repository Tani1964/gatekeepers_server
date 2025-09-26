import { Game } from "../../models/Game";

export class GameAdminController {
  async createGame(req: any, res: any) {
    try {
      const {
        user,
        title,
        startTime,
        startDate,
        durationInMinutes,
        price,
        friends,
        enemies,
        friendDescription,
        enemyDescription,
        showFriendImages,
        showEnemyImages,
      } = req.body;

      const game = new Game({
        title,
        startTime,
        startDate,
        durationInMinutes,
        price,
        friends: friends || [],
        enemies: enemies || [],
        friendDescription: friendDescription || "",
        enemyDescription: enemyDescription || "",
        showFriendImages:
          showFriendImages !== undefined ? showFriendImages : true,
        showEnemyImages: showEnemyImages !== undefined ? showEnemyImages : true,
        createdBy: user.id,
      });

      await game.save();

      res.status(201).json({
        success: true,
        message: "Game created successfully",
        data: game,
      });
    } catch (error) {
      console.error("Error creating game:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create game",
        error: error,
      });
    }
  }

  async getGame(req: any, res: any) {
    const { id, user } = req.params;

    const game = await Game.findById(id, { createdBy: user.id });

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
  }

  async getMyGames(req: any, res: any) {
    try {
      const { id: userId } = req.params;
      console.log(userId);

      const games = await Game.find({ players: userId });

      res.status(200).json({
        success: true,
        data: games,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async updateGame(req: any, res: any) {
    const { id } = req.params;
    const { user, title, startTime, startDate, durationInMinutes, price } =
      req.body;

    const game = await Game.findById(id, { createdBy: user.id });

    if (!game) {
      return res.status(404).json({
        success: false,
        message: "Game not found",
      });
    }

    const updatedGame = await Game.findByIdAndUpdate(
      id,
      {
        title,
        startTime,
        startDate,
        durationInMinutes,
        price,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!game) {
      return res.status(404).json({
        success: false,
        message: "Game not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Game updated successfully",
      data: game,
    });
  }

  async deleteGame(req: any, res: any) {
    const { id } = req.params;

    const game = await Game.findByIdAndDelete(id);

    if (!game) {
      return res.status(404).json({
        success: false,
        message: "Game not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Game deleted successfully",
    });
  }
}
