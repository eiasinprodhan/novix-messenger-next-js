import { ReportModel } from './sqlite-models';

export interface IReport {
  _id: string;
  id: string;
  reporter: any;
  reported: any;
  reason: string;
  details?: string;
  status: string;
  createdAt: Date;
  save(): Promise<any>;
}

const Report: any = ReportModel;
export default Report;
