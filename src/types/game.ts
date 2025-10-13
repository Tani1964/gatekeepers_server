import mongoose, { Document, Model, Schema } from "mongoose";

export interface IGame extends Document {
  title: string;
  startTime: string;
  startDate: string;
  durationInMinutes: number;
  players: mongoose.Types.ObjectId[];
  connectedUsers: number;
  connectedUsersArray?: string[]; // Optional array to track connected user IDs
  readyUsers: number;
  readyUsersArray?: string[]; // Optional array to track ready user IDs
  friends: string[];
  enemies: string[];
  friendDescription?: string;
  enemyDescription?: string;
  showFriendImages?: boolean;
  showEnemyImages?: boolean;
  price: number;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}