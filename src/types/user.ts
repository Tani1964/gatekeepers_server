import mongoose, { Document, Model, Schema } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  profileImage?: string;
  profileImagePublicId?: string;
  age?: number;
  passwordHash: string;
  eyes: number;
  phoneNumber?: string;
  role: 'user' | 'admin';
  userGameDetails: mongoose.Types.ObjectId[];
  isActive: boolean;
  tags: string[];
  notifications:any;
  referralCode?: string;
  referrals?: string[];
  referralChallenges?: number;
  pendingReferrals?: number;
  referralEyes?: number;
  monthlyDurationPlayed?: number; // in minutes
  yearlyDurationPlayed?: number; // in minutes
  wallet?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  pushToken?: string | null;
  pushTokens?: { token: string; device: string; lastUsed: Date }[];
  notificationPreferences?: {
    enabled: boolean;
    gameStart: boolean;
    gameEnd: boolean;
    friendActivity: boolean;
  };


  initials: string;

  getPublicProfile(): {
    id: string;
    name: string;
    email: string;
    isActive: boolean;
  };
}


export interface IUserModel extends Model<IUser> {
  findByEmail(email: string): Promise<IUser | null>;
}

export interface IUserGameDetails extends Document {
  userId: mongoose.Types.ObjectId;
  games: mongoose.Types.ObjectId[];
  score: number;
  level: number;
  eyes: number;
  gamesPlayed: number;
  yearlyPosition: number;
  achievements: string[];
}