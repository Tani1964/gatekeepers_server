import { User } from "../../models/User";

export class LeaderBoard {
  async getMonthlyLeaderBoard(req: any, res: any) {
    try {
      const users = await User.find()
        .sort({ "userGameDetails.score": -1 })
        .limit(10);
      res.status(200).json({ leaderboard: users });
    } catch (error) {
      res.status(500).json({ error: "Failed to retrieve leaderboard" });
    }
  }

  async getYearlyLeaderBoard(req: any, res: any) {
    try {
      const users = await User.find()
        .sort({ "userGameDetails.score": -1 })
        .limit(10);
      res.status(200).json({ leaderboard: users });
    } catch (error) {
      res.status(500).json({ error: "Failed to retrieve leaderboard" });
    }
  }
}
