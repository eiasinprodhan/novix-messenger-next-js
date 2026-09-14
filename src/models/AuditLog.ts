import { AuditLogModel } from './sqlite-models';

export interface IAuditLog {
  _id: string;
  id: string;
  admin: any;
  action: string;
  targetType?: string;
  targetId?: string;
  details?: any;
  ipAddress?: string;
  createdAt: Date;
  save(): Promise<any>;
}

const AuditLog: any = AuditLogModel;
export default AuditLog;
