import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IGroupMember {
  user: mongoose.Types.ObjectId;
  role: 'member' | 'admin';
  joinedAt: Date;
}

export interface IGroup extends Document {
  name: string;
  description?: string;
  avatar?: string;
  createdBy: mongoose.Types.ObjectId;
  members: IGroupMember[];
  isActive: boolean;
  hideMembers: boolean;
  groupType: string;
  topicsEnabled: boolean;
  pinnedMessage?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const GroupSchema: Schema<IGroup> = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 300,
      default: '',
    },
    avatar: {
      type: String,
      default: '',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        user: { type: Schema.Types.ObjectId, ref: 'User' },
        role: { type: String, enum: ['member', 'admin'], default: 'member' },
        joinedAt: { type: Date, default: Date.now },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    hideMembers: {
      type: Boolean,
      default: false,
    },
    groupType: {
      type: String,
      default: 'Public',
    },
    topicsEnabled: {
      type: Boolean,
      default: false,
    },
    pinnedMessage: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
  },
  { timestamps: true }
);

// Ensure creator is always admin
GroupSchema.pre('save', function () {
  if (this.isNew) {
    const creatorExists = this.members.some(
      (m) => m && m.user && this.createdBy && m.user.toString() === this.createdBy.toString() && m.role === 'admin'
    );
    if (!creatorExists && this.createdBy) {
      this.members.push({
        user: this.createdBy,
        role: 'admin',
        joinedAt: new Date(),
      } as any);
    }
  }
});

if (mongoose.models.Group) {
  try { mongoose.deleteModel('Group'); } catch (_) {}
}
if ((mongoose as any).modelSchemas && (mongoose as any).modelSchemas.Group) {
  delete (mongoose as any).modelSchemas.Group;
}

const Group: Model<IGroup> = mongoose.model<IGroup>('Group', GroupSchema);

export default Group;
