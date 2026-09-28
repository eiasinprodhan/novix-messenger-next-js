import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IFriendship extends Document {
  requester: mongoose.Types.ObjectId;
  recipient: mongoose.Types.ObjectId;
  status: 'pending' | 'accepted' | 'rejected' | 'blocked';
  createdAt: Date;
  updatedAt: Date;
}

const FriendshipSchema: Schema<IFriendship> = new Schema(
  {
    requester: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'blocked'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

// Ensure no duplicate friendships and fast queries
FriendshipSchema.index({ requester: 1, recipient: 1 }, { unique: true });
FriendshipSchema.index({ requester: 1, status: 1, createdAt: -1 });
FriendshipSchema.index({ recipient: 1, status: 1, createdAt: -1 });
FriendshipSchema.index({ requester: 1, status: 1 });
FriendshipSchema.index({ recipient: 1, status: 1 });

const Friendship: Model<IFriendship> =
  mongoose.models.Friendship || mongoose.model<IFriendship>('Friendship', FriendshipSchema);

export default Friendship;
