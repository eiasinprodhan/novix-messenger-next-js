import { UserModel } from './sqlite-models';

export interface IUser {
  _id: string;
  id: string;
  name: string;
  username: string;
  email: string;
  password?: string;
  bio?: string;
  avatar?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null;
  country?: string;
  birthday?: Date | null;
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
  publicKey?: string | null;
  lastSeenPrivacy: 'everyone' | 'contacts' | 'nobody';
  readReceiptsEnabled: boolean;
  typingIndicatorsEnabled: boolean;
  hiddenChats: string[];
  devices: {
    deviceId: string;
    deviceName: string;
    deviceType: string;
    os: string;
    browser: string;
    ipAddress: string;
    lastActiveAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  save(): Promise<any>;
  toObject(): any;
  toJSON(): any;
}

const User: any = UserModel;
export default User;
