import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  username: string;
  email: string;
  password?: string;
  bio?: string;
  avatar?: string;
  phone?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  country?: string;
  birthday?: Date;
  isVerified: boolean;
  verificationCode?: string;
  verificationCodeExpires?: Date;
  verificationResendAt?: Date;
  resetPasswordCode?: string;
  resetPasswordCodeExpires?: Date;
  pendingEmail?: string;
  pendingEmailCode?: string;
  pendingEmailCodeExpires?: Date;
  pendingEmailResendAt?: Date;
  googleId?: string;
  lastSeen: Date;
  lastActiveAt: Date;
  isOnline: boolean;
  fcmToken?: string;
  role: 'user' | 'admin';
  notificationsEnabled: boolean;
  lastSeenPrivacy: 'everyone' | 'contacts' | 'nobody';
  readReceiptsEnabled: boolean;
  typingIndicatorsEnabled: boolean;
  hiddenChats: mongoose.Types.ObjectId[];
  drafts?: Map<string, string>;
  archivedChats?: string[];
  mutedChats?: { chatId: string; mutedUntil?: Date }[];
  unreadChats?: string[];
  folders?: {
    id: string;
    name: string;
    iconName?: string;
    includedTypes?: string[];
    excludedTypes?: string[];
    includedChatIds?: string[];
    excludedChatIds?: string[];
  }[];
  devices: {
    deviceId: string;
    deviceName: string;
    deviceType: string;
    os: string;
    browser: string;
    ipAddress: string;
    lastActiveAt: Date;
  }[];
  // Telegram Features
  isPremium?: boolean;
  premiumExpiresAt?: Date;
  premiumPlan?: 'monthly' | 'annual';
  starsBalance?: number;
  starTransactions?: {
    id: string;
    type: 'purchase' | 'gift_sent' | 'gift_received' | 'subscription' | 'reward';
    amount: number;
    title: string;
    description?: string;
    createdAt: Date;
  }[];
  businessSettings?: {
    isEnabled: boolean;
    location?: { address: string; showOnProfile?: boolean };
    openingHours?: {
      enabled: boolean;
      schedule: { day: string; open: string; close: string; isClosed: boolean; is24Hours: boolean }[];
    };
    quickReplies?: { id: string; shortcut: string; message: string }[];
    greetingMessage?: { enabled: boolean; text: string; recipients: string };
    awayMessage?: { enabled: boolean; text: string; schedule: string };
    businessIntro?: { title: string; message: string };
    chatbot?: { enabled: boolean; botUsername?: string };
  };
  giftsReceived?: {
    id: string;
    giftId: string;
    giftName: string;
    giftIcon: string;
    starPrice: number;
    senderId: string;
    senderName: string;
    senderAvatar?: string;
    isAnonymous: boolean;
    message?: string;
    sentAt: Date;
    isPinned: boolean;
    convertedToStars: boolean;
  }[];
  identityVerified?: boolean;
  verificationSelfieUrl?: string;
  twoFactorEnabled?: boolean;
  passkeys?: { id: string; name: string; createdAt: Date }[];
  savedAds?: { id: string; title: string; advertiser: string; imageUrl: string; url: string; savedAt: Date }[];
  hiddenAdvertisers?: string[];
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 50 },
    username: {
      type: String, required: true, unique: true, trim: true, lowercase: true,
      minlength: 3, maxlength: 30,
      match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers and underscores'],
    },
    email: {
      type: String, required: true, unique: true, trim: true, lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: function (this: any) { return !this.googleId; },
      minlength: 6,
      select: false,
    },
    phone: { type: String, trim: true, default: '' },
    bio: { type: String, default: '', maxlength: 150 },
    avatar: { type: String, default: '' },
    gender: { type: String, enum: ['male', 'female', 'other', 'prefer_not_to_say'], default: null },
    country: { type: String, trim: true, maxlength: 60, default: '' },
    birthday: { type: Date, default: null },
    isVerified: { type: Boolean, default: false },
    verificationCode: String,
    verificationCodeExpires: Date,
    verificationResendAt: Date,
    resetPasswordCode: { type: String, select: false },
    resetPasswordCodeExpires: Date,
    pendingEmail: String,
    pendingEmailCode: { type: String, select: false },
    pendingEmailCodeExpires: Date,
    pendingEmailResendAt: Date,
    googleId: { type: String, unique: true, sparse: true },
    lastSeen: { type: Date, default: Date.now },
    lastActiveAt: { type: Date, default: Date.now },
    isOnline: { type: Boolean, default: false },
    fcmToken: { type: String },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    notificationsEnabled: { type: Boolean, default: true },
    lastSeenPrivacy: { type: String, enum: ['everyone', 'contacts', 'nobody'], default: 'everyone' },
    readReceiptsEnabled: { type: Boolean, default: true },
    typingIndicatorsEnabled: { type: Boolean, default: true },
    hiddenChats: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    drafts: { type: Map, of: String, default: {} },
    archivedChats: [{ type: String }],
    mutedChats: [
      {
        chatId: { type: String, required: true },
        mutedUntil: { type: Date },
      },
    ],
    unreadChats: [{ type: String }],
    folders: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true },
        iconName: { type: String, default: 'folder' },
        includedTypes: [{ type: String }],
        excludedTypes: [{ type: String }],
        includedChatIds: [{ type: String }],
        excludedChatIds: [{ type: String }],
      },
    ],
    devices: [
      {
        deviceId: { type: String, required: true },
        deviceName: { type: String, default: 'Unknown Device' },
        deviceType: { type: String, default: 'unknown' },
        os: { type: String, default: '' },
        browser: { type: String, default: '' },
        ipAddress: { type: String, default: '' },
        lastActiveAt: { type: Date, default: Date.now },
      }
    ],
    // Telegram Features
    isPremium: { type: Boolean, default: false },
    premiumExpiresAt: { type: Date },
    premiumPlan: { type: String, enum: ['monthly', 'annual'], default: null },
    starsBalance: { type: Number, default: 250 }, // 250 starter stars for fun!
    starTransactions: [
      {
        id: { type: String, required: true },
        type: { type: String, enum: ['purchase', 'gift_sent', 'gift_received', 'subscription', 'reward'], required: true },
        amount: { type: Number, required: true },
        title: { type: String, required: true },
        description: { type: String, default: '' },
        createdAt: { type: Date, default: Date.now },
      }
    ],
    businessSettings: {
      isEnabled: { type: Boolean, default: false },
      location: {
        address: { type: String, default: '' },
        showOnProfile: { type: Boolean, default: true },
      },
      openingHours: {
        enabled: { type: Boolean, default: false },
        schedule: [
          {
            day: { type: String },
            open: { type: String, default: '09:00' },
            close: { type: String, default: '18:00' },
            isClosed: { type: Boolean, default: false },
            is24Hours: { type: Boolean, default: false },
          }
        ],
      },
      quickReplies: [
        {
          id: { type: String },
          shortcut: { type: String },
          message: { type: String },
        }
      ],
      greetingMessage: {
        enabled: { type: Boolean, default: false },
        text: { type: String, default: 'Hello! Thanks for reaching out. How can I help you today?' },
        recipients: { type: String, default: 'all' },
      },
      awayMessage: {
        enabled: { type: Boolean, default: false },
        text: { type: String, default: 'I am currently away. I will get back to you as soon as possible!' },
        schedule: { type: String, default: 'outside_hours' },
      },
      businessIntro: {
        title: { type: String, default: '' },
        message: { type: String, default: '' },
      },
      chatbot: {
        enabled: { type: Boolean, default: false },
        botUsername: { type: String, default: '' },
      },
    },
    giftsReceived: [
      {
        id: { type: String, required: true },
        giftId: { type: String, required: true },
        giftName: { type: String, required: true },
        giftIcon: { type: String, required: true },
        starPrice: { type: Number, required: true },
        senderId: { type: String, required: true },
        senderName: { type: String, required: true },
        senderAvatar: { type: String, default: '' },
        isAnonymous: { type: Boolean, default: false },
        message: { type: String, default: '' },
        sentAt: { type: Date, default: Date.now },
        isPinned: { type: Boolean, default: true },
        convertedToStars: { type: Boolean, default: false },
      }
    ],
    // Security & Identity Confirmation
    identityVerified: { type: Boolean, default: false },
    verificationSelfieUrl: { type: String, default: '' },
    twoFactorEnabled: { type: Boolean, default: false },
    passkeys: [
      {
        id: { type: String, required: true },
        name: { type: String, default: 'Passkey' },
        createdAt: { type: Date, default: Date.now },
      }
    ],
    // Ad Preferences
    savedAds: [
      {
        id: { type: String, required: true },
        title: { type: String, required: true },
        advertiser: { type: String, required: true },
        imageUrl: { type: String, default: '' },
        url: { type: String, default: '' },
        savedAt: { type: Date, default: Date.now },
      }
    ],
    hiddenAdvertisers: [{ type: String }],
  },
  { timestamps: true }
);


// ========================================================================
// THIS IS THE CORRECT VERSION (V12 - FINAL)
// Pure async pre('save') — NO "next" is ever used or declared.
// This completely fixes "TypeError: next is not a function"
// ========================================================================

console.log('>>> [User.ts V12] Loading User model...');

// 1. Kill every possible cached version of the model
if (mongoose.models.User) {
  try { mongoose.deleteModel('User'); } catch (_) {}
}
if ((mongoose as any).modelSchemas && (mongoose as any).modelSchemas.User) {
  delete (mongoose as any).modelSchemas.User;
}

// 2. PURE ASYNC PRE HOOK (the only correct way in 2026)
UserSchema.pre('save', async function () {
  const user = this as any;

  console.log('>>> [User pre-save V12] PURE ASYNC hook running for:', user.email);

  if (!user.isModified('password')) {
    console.log('>>> [User pre-save V12] password unchanged — skipping');
    return;
  }

  try {
    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(user.password, salt);
    console.log('>>> [User pre-save V12] ✅ password hashed successfully');
  } catch (err: any) {
    console.error('>>> [User pre-save V12] HASH ERROR:', err);
    throw err;
  }
});

UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

UserSchema.set('toJSON', {
  transform: function (doc, ret) {
    delete ret.password;
    delete ret.verificationCode;
    delete ret.verificationCodeExpires;
    delete ret.googleId;
    return ret;
  },
});

const User: Model<IUser> = mongoose.model<IUser>('User', UserSchema);

console.log('>>> [User.ts V12] User model registered (pure async hook)');

export default User;
