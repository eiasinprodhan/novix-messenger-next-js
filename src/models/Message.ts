import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMessage extends Document {
  sender: mongoose.Types.ObjectId;
  receiver?: mongoose.Types.ObjectId;      // For 1:1 chats
  group?: mongoose.Types.ObjectId;         // For group chats
  content: string;
  type: 'text' | 'image' | 'system' | 'audio' | 'voice' | 'video' | 'document' | 'call' | 'poll' | 'checklist';
  imageUrl?: string;
  effect?: string;
  transcription?: string;
  status: 'sent' | 'delivered' | 'read';
  isDeleted: boolean;
  isPinned: boolean;
  isEdited?: boolean;
  editedAt?: Date;
  forwardFrom?: {
    sender?: mongoose.Types.ObjectId;
    senderName?: string;
    originalMessageId?: mongoose.Types.ObjectId;
  };
  attachments?: {
    url: string;
    fileType: string;
    fileName: string;
    fileSize?: number;
    duration?: number;
    waveform?: number[];
  }[];
  topicId?: string;
  scheduledFor?: Date;
  expiresAt?: Date;
  isSilent?: boolean;
  poll?: {
    question: string;
    options: { id: string; text: string; votes: mongoose.Types.ObjectId[] }[];
    isAnonymous?: boolean;
    allowMultiple?: boolean;
    isQuiz?: boolean;
    correctAnswerIndex?: number;
    isClosed?: boolean;
  };
  checklist?: {
    title: string;
    items: { id: string; text: string; completed: boolean; completedBy?: mongoose.Types.ObjectId }[];
  };
  deletedBy: mongoose.Types.ObjectId[];
  replyTo?: mongoose.Types.ObjectId;
  reactions: { user: mongoose.Types.ObjectId; emoji: string }[];
  readBy: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema: Schema<IMessage> = new Schema(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiver: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: function (this: any) {
        return !this.group;
      },
    },
    group: {
      type: Schema.Types.ObjectId,
      ref: 'Group',
    },
    content: {
      type: String,
      default: '',
      maxlength: 4000,
    },
    type: {
      type: String,
      enum: ['text', 'image', 'system', 'audio', 'voice', 'video', 'document', 'call', 'poll', 'checklist'],
      default: 'text',
    },
    imageUrl: {
      type: String,
    },
    effect: {
      type: String,
      default: null,
    },
    transcription: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['sent', 'delivered', 'read'],
      default: 'sent',
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
    },
    forwardFrom: {
      sender: { type: Schema.Types.ObjectId, ref: 'User' },
      senderName: { type: String },
      originalMessageId: { type: Schema.Types.ObjectId, ref: 'Message' },
    },
    attachments: [
      {
        url: { type: String, required: true },
        fileType: { type: String, default: 'file' },
        fileName: { type: String, default: '' },
        fileSize: { type: Number },
        duration: { type: Number },
        waveform: [{ type: Number }],
      },
    ],
    topicId: {
      type: String,
      index: true,
    },
    scheduledFor: {
      type: Date,
      index: true,
    },
    expiresAt: {
      type: Date,
      index: true,
    },
    isSilent: {
      type: Boolean,
      default: false,
    },
    poll: {
      question: { type: String },
      options: [
        {
          id: { type: String, required: true },
          text: { type: String, required: true },
          votes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
        },
      ],
      isAnonymous: { type: Boolean, default: false },
      allowMultiple: { type: Boolean, default: false },
      isQuiz: { type: Boolean, default: false },
      correctAnswerIndex: { type: Number },
      isClosed: { type: Boolean, default: false },
    },
    checklist: {
      title: { type: String, default: '' },
      items: [
        {
          id: { type: String, required: true },
          text: { type: String, required: true },
          completed: { type: Boolean, default: false },
          completedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        },
      ],
    },
    deletedBy: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    replyTo: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
    },
    reactions: [
      {
        user: { type: Schema.Types.ObjectId, ref: 'User' },
        emoji: { type: String },
      },
    ],
    readBy: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  { timestamps: true }
);

// Compound Indexes for high-performance messaging queries
MessageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
MessageSchema.index({ receiver: 1, sender: 1, createdAt: -1 });
MessageSchema.index({ receiver: 1, status: 1 });
MessageSchema.index({ group: 1, createdAt: -1 });
MessageSchema.index({ createdAt: -1 });

const Message: Model<IMessage> =
  mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);

export default Message;
