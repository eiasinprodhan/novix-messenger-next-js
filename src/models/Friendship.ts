import { FriendshipModel } from './sqlite-models';

export interface IFriendship {
  _id: string;
  id: string;
  requester: any;
  recipient: any;
  status: 'pending' | 'accepted' | 'rejected' | 'blocked';
  createdAt: Date;
  updatedAt: Date;
  save(): Promise<any>;
}

const Friendship: any = FriendshipModel;
export default Friendship;
