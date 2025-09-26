import { User } from "../../models/User";
import { UserGameDetails } from "../../models/UserGameDetails";

export class UserGameController {
    async addEyesToGame(req:any, res:any) {
        const userId = req.user.id;
        const {  amount } = req.params;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        const game = await UserGameDetails.findOne({ userId });
        if (!game) {
            return res.status(404).json({
                success: false,
                message: "Game not found",
            });
        }

        game.eyes += amount;
        await user.save();

        res.status(200).json({
            success: true,
            message: "Added eyes to game",
        });
    }

    async removeEyesFromGame(req:any, res:any) {
        const userId = req.user.id;
        const {  amount } = req.params;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        const game = await UserGameDetails.findOne({ userId });
        if (!game) {
            return res.status(404).json({
                success: false,
                message: "Game not found",
            });
        }

        game.eyes -= amount;
        await user.save();

        res.status(200).json({
            success: true,
            message: "Removed eyes from game",
        });
    }
}
