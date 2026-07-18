import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IStory extends Document {
  user: mongoose.Types.ObjectId;
  imageUrl: string;
  isArchived: boolean;
  reactions: {
    user: mongoose.Types.ObjectId;
    reaction: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const StorySchema: Schema<IStory> = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    reactions: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        reaction: {
          type: String,
          required: true,
        },
      },
    ],
  },
  { timestamps: true }
);

const Story: Model<IStory> =
  mongoose.models.Story || mongoose.model<IStory>('Story', StorySchema);

export default Story;
