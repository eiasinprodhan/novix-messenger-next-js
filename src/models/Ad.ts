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
  creatorId?: mongoose.Types.ObjectId;
  creatorName?: string;
  creatorAvatar?: string;
  status?: 'draft' | 'active' | 'paused' | 'expired';
  dailyRate?: number;
  subscribedDays?: number;
  activeUntil?: Date;
  adType?: 'website' | 'chat';
  targetCountryType?: 'all' | 'specific';
  targetCountries?: string[];
  targetGender?: 'all' | 'male' | 'female';
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
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    creatorName: { type: String, default: '' },
    creatorAvatar: { type: String, default: '' },
    status: {
      type: String,
      enum: ['draft', 'active', 'paused', 'expired'],
      default: 'active',
      index: true,
    },
    dailyRate: { type: Number, default: 1 },
    subscribedDays: { type: Number, default: 0 },
    activeUntil: { type: Date },
    adType: { type: String, enum: ['website', 'chat'], default: 'website' },
    targetCountryType: { type: String, enum: ['all', 'specific'], default: 'all' },
    targetCountries: { type: [String], default: [] },
    targetGender: { type: String, enum: ['all', 'male', 'female'], default: 'all' },
  },
  {
    timestamps: true,
  }
);

const Ad: Model<IAd> = mongoose.models.Ad || mongoose.model<IAd>('Ad', AdSchema);

export default Ad;

