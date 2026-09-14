import { SystemSettingModel } from './sqlite-models';

export interface ISystemSetting {
  key: string;
  value: any;
  updatedAt: Date;
}

const SystemSetting: any = SystemSettingModel;
export default SystemSetting;
