import { MessageModel } from './sqlite-models';

export interface IMessage {
  _id: string;
  id: string;
  sender: any;
  senderId: string;
  receiver?: any;
  receiverId?: string;
  group?: any;
  groupId?: string;
  content: string;
  type: 'text' | 'image' | 'system' | 'audio' | 'voice' | 'video' | 'document' | 'call' | 'poll';
  imageUrl?: string;
  status: 'sent' | 'delivered' | 'read';
  isDeleted: boolean;
  isPinned?: boolean;
  isEdited?: boolean;
  editedAt?: Date;
  forwardFrom?: any;
  attachments?: any[];
  topicId?: string;
  scheduledFor?: Date;
  expiresAt?: Date;
  poll?: any;
  deletedBy?: any[];
  replyTo?: any;
  reactions?: any[];
  readBy?: any[];
  isDelivered?: boolean;
  deliveredAt?: Date;
  encryptedPayload?: string;
  isEphemeralTransit?: boolean;
  createdAt: Date;
  updatedAt: Date;
  save(): Promise<any>;
  toObject(): any;
  toJSON(): any;
}

const Message: any = MessageModel;
export default Message;
