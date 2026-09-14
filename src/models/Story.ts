import { StoryModel } from './sqlite-models';

export interface IStory {
  _id: string;
  id: string;
  user: any;
  imageUrl: string;
  isArchived: boolean;
  views: any[];
  reactions: any[];
  createdAt: Date;
  save(): Promise<any>;
}

const Story: any = StoryModel;
export default Story;
