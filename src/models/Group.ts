import { GroupModel } from './sqlite-models';

export interface IGroupMember {
  user: any;
  role: 'member' | 'admin';
  joinedAt: Date;
}

export interface IGroup {
  _id: string;
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  createdBy: any;
  members: IGroupMember[];
  isActive: boolean;
  hideMembers?: boolean;
  groupType?: string;
  topicsEnabled?: boolean;
  pinnedMessage?: any;
  autoApprove?: boolean;
  pendingRequests?: any[];
  createdAt: Date;
  updatedAt: Date;
  save(): Promise<any>;
}

const Group: any = GroupModel;
export default Group;
