import mongoose, { Document, Model, Schema } from "mongoose";
import { IUserGameDetails } from "../types/user";

const userGameDetailsSchema = new Schema<IUserGameDetails>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    games: [
      {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "Game",
      },
    ],
    score: {
      type: Number,
      default: 0,
    },
    level: {
      type: Number,
      default: 1,
    },
    eyes: {
      type: Number,
      default: 0,
    },
    gamesPlayed: {
      type: Number,
      default: 0,
    },
    yearlyPosition: {
      type: Number,
      default: 0,
    },
    achievements: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const UserGameDetails = mongoose.model<IUserGameDetails>(
  "UserGameDetails",
  userGameDetailsSchema
);
