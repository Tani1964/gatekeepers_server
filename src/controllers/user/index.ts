import { User } from "../../models/User";

export class UserController {
  async getUser(req: any, res: any) {
    const userId = req.user.id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  }

  async updateUser(req: any, res: any) {
    const userId = req.params.id;
    const { name, email } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { name, email, updatedAt: new Date() },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: user,
    });
  }

  async deleteUser(req: any, res: any) {
    const userId = req.user.id;

    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  }

  async getMonthlyLeaderboard(req: any, res: any) {
    try {
      const userId = req.params.id; // Assuming user ID is in params

      // Fetch all users sorted by monthlyDurationPlayed
      const users = await User.find()
        .sort({ monthlyDurationPlayed: -1 })
        .select("name email monthlyDurationPlayed");

      // Find the position of the requested user
      const userPosition =
        users.findIndex((user) => user.id.toString() === userId) + 1 || null;

      // Take top 10 users and add position
      const topUsersWithPosition = users.slice(0, 10).map((user, index) => ({
        id: user.id,
        name: user.name,
        monthlyDurationPlayed: user.monthlyDurationPlayed,
        position: index + 1, // since slice is already top 10
      }));

      res.status(200).json({
        success: true,
        data: {
          topUsers: topUsersWithPosition,
          userPosition, // overall position of requested user
        },
      });
    } catch (error) {
      console.error("Error fetching monthly leaderboard:", error);
      res.status(500).json({
        success: false,
        message: "An error occurred while fetching the monthly leaderboard.",
      });
    }
  }

  async getYearlyLeaderboard(req: any, res: any) {
    try {
      const userId = req.params.id; // Assuming user ID is in params

      // Fetch all users sorted by yearlyDurationPlayed
      const users = await User.find()
        .sort({ yearlyDurationPlayed: -1 })
        .select("name email yearlyDurationPlayed");

      // Find the position of the requested user
      const userPosition =
        users.findIndex((user) => user.id.toString() === userId) + 1 || null;

      // Take top 10 users and add position
      const topUsersWithPosition = users.slice(0, 10).map((user, index) => ({
        id: user.id,
        name: user.name,
        yearlyDurationPlayed: user.yearlyDurationPlayed,
        position: index + 1,
      }));

      res.status(200).json({
        success: true,
        data: {
          topUsers: topUsersWithPosition,
          userPosition, // overall position of requested user
        },
      });
    } catch (error) {
      console.error("Error fetching yearly leaderboard:", error);
      res.status(500).json({
        success: false,
        message: "An error occurred while fetching the yearly leaderboard.",
      });
    }
  }
}
