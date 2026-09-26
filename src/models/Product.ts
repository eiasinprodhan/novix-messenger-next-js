import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProduct extends Document {
  seller: mongoose.Types.ObjectId;
  title: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  condition: string;
  images: string[];
  location?: string;
  isSold: boolean;
  views: number;
  status: 'active' | 'archived' | 'sold';
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema: Schema<IProduct> = new Schema(
  {
    seller: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      default: '',
      maxlength: 3000,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'USD',
      trim: true,
      uppercase: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    condition: {
      type: String,
      default: 'Brand New',
      trim: true,
    },
    images: {
      type: [String],
      default: [],
    },
    location: {
      type: String,
      default: '',
      trim: true,
    },
    isSold: {
      type: Boolean,
      default: false,
      index: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['active', 'archived', 'sold'],
      default: 'active',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

ProductSchema.index({ title: 'text', description: 'text' });

const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);

export default Product;
