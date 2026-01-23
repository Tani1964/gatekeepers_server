import mongoose, { Document, Schema } from 'mongoose';

export interface ISplashAd extends Document {
  imageUrl: string;
  imagePublicId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SplashAdSchema = new Schema<ISplashAd>(
  {
    imageUrl: {
      type: String,
      required: true,
      default: ''
    },
    imagePublicId: {
      type: String,
      required: false,
      default: ''
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

const SplashAd = mongoose.model<ISplashAd>('SplashAd', SplashAdSchema);

export default SplashAd;
