import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOrder extends Document {
  product: mongoose.Types.ObjectId;
  buyer: mongoose.Types.ObjectId;
  seller: mongoose.Types.ObjectId;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  currency: string;
  deliveryAddress: string;
  contactPhone: string;
  notes?: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema: Schema<IOrder> = new Schema(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    buyer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    seller: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1,
    },
    unitPrice: {
      type: Number,
      required: true,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'USD',
      trim: true,
      uppercase: true,
    },
    deliveryAddress: {
      type: String,
      required: true,
      trim: true,
    },
    contactPhone: {
      type: String,
      required: true,
      trim: true,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'shipped', 'completed', 'cancelled'],
      default: 'pending',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);

export default Order;
