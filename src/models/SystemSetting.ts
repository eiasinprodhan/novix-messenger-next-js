import mongoose, { Schema, Document } from 'mongoose';

export interface ISystemSetting extends Document {
  key: string;
  value: any;
  updatedAt: Date;
  createdAt: Date;
}

const SystemSettingSchema = new Schema<ISystemSetting>(
  {
    key: { type: String, required: true, unique: true, index: true },
    value: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.SystemSetting ||
  mongoose.model<ISystemSetting>('SystemSetting', SystemSettingSchema);
