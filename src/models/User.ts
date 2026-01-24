import mongoose, { Document, Model, Schema } from "mongoose";
import { IUser, IUserModel } from "../types/user";

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [50, "Name cannot be more than 50 characters"],
    },
    phoneNumber: {
      type: String,
      required: false,
      trim: true,
      maxlength: [15, "Phone number cannot be more than 15 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    profileImage: {
      type: String,
      required: [true, "Profile image is required"],
      trim: true,
    },
    profileImagePublicId: {
      type: String,
      required: false,
      trim: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    eyes: {
      type: Number,
      default: 0,
    },
    age: {
      type: Number,
      min: [0, "Age cannot be negative"],
      max: [120, "Age cannot be more than 120"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    passwordHash: {
      type: String,
      required: [true, "Password is required"],
    },
    userGameDetails: [
      {
        type: mongoose.Types.ObjectId,
        ref: "UserGameDetails",
      },
    ],
    referralCode: {
      type: String,
      unique: true,
      sparse: true,
    },
    referrals: {
      type: [{ id: String, createdAt: { type: Date, default: Date.now } }],
    },
    monthlyDurationPlayed: {
      // in minutes
      type: Number,
      default: 0,
    },
    yearlyDurationPlayed: {
      // in minutes
      type: Number,
      default: 0,
    },
    wallet: {
      type: mongoose.Types.ObjectId,
      ref: "Wallet",
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    pushToken: {
      type: String,
      default: null,
    },
    pushTokens: [
      {
        token: String,
        device: String,
        lastUsed: Date,
      },
    ],
    notificationPreferences: {
      enabled: {
        type: Boolean,
        default: true,
      },
      gameStart: {
        type: Boolean,
        default: true,
      },
      gameEnd: {
        type: Boolean,
        default: true,
      },
      friendActivity: {
        type: Boolean,
        default: true,
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

userSchema.virtual("initials").get(function (this: IUser) {
  return this.name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase();
});

userSchema.pre<IUser>("save", function (next) {
  if (this.isModified("email")) {
    this.email = this.email.toLowerCase();
  }
  next();
});

userSchema.methods.getPublicProfile = function (this: IUser) {
  return {
    id: this.id.toString(),
    name: this.name,
    email: this.email,
    isActive: this.isActive,
  };
};

userSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

export const User = mongoose.model<IUser, IUserModel>("User", userSchema);
