import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAd extends Document {
  title: string;
  description: string;
  advertiser: string;
  advertiserLogo?: string;
  imageUrl?: string;
  ctaText: string;
  url: string;
  category: string;
  isActive: boolean;
  impressions: number;
  clicks: number;
  createdAt: Date;
  updatedAt: Date;
}

const AdSchema = new Schema<IAd>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    advertiser: { type: String, required: true, trim: true },
    advertiserLogo: { type: String, default: '' },
    imageUrl: { type: String, default: '' },
    ctaText: { type: String, default: 'Learn More', trim: true },
    url: { type: String, required: true, trim: true },
    category: { type: String, default: 'General', trim: true },
    isActive: { type: Boolean, default: true },
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

const Ad: Model<IAd> = mongoose.models.Ad || mongoose.model<IAd>('Ad', AdSchema);

export default Ad;
