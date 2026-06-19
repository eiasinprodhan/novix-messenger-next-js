import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  username: string;
  email: string;
  password?: string;
  bio?: string;
  avatar?: string;
  isVerified: boolean;
  verificationCode?: string;
  verificationCodeExpires?: Date;
  googleId?: string;
  lastSeen: Date;
  isOnline: boolean;
  role: 'user' | 'admin';
  notificationsEnabled: boolean;
  lastSeenPrivacy: 'everyone' | 'contacts' | 'nobody';
  readReceiptsEnabled: boolean;
  typingIndicatorsEnabled: boolean;
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
    bio: { type: String, default: '', maxlength: 150 },
    avatar: { type: String, default: '' },
    isVerified: { type: Boolean, default: false },
    verificationCode: String,
    verificationCodeExpires: Date,
    googleId: { type: String, unique: true, sparse: true },
    lastSeen: { type: Date, default: Date.now },
    isOnline: { type: Boolean, default: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    notificationsEnabled: { type: Boolean, default: true },
    lastSeenPrivacy: { type: String, enum: ['everyone', 'contacts', 'nobody'], default: 'everyone' },
    readReceiptsEnabled: { type: Boolean, default: true },
    typingIndicatorsEnabled: { type: Boolean, default: true },
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
