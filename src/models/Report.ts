import mongoose, { Schema, Document, Model } from 'mongoose';

export type ReportReason =
  | 'spam'
  | 'harassment'
  | 'hate_speech'
  | 'violence'
  | 'fake_account'
  | 'inappropriate_content'
  | 'scam'
  | 'other';

export interface IReport extends Document {
  reporter: mongoose.Types.ObjectId;   // user who filed the report
  reported: mongoose.Types.ObjectId;   // user being reported
  reason: ReportReason;
  message?: string;                    // optional additional details
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema: Schema<IReport> = new Schema(
  {
    reporter: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reported: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reason: {
      type: String,
      required: true,
      enum: [
        'spam',
        'harassment',
        'hate_speech',
        'violence',
        'fake_account',
        'inappropriate_content',
        'scam',
        'other',
      ],
    },
    message: { type: String, maxlength: 500, default: '' },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

// Compound index: a user can submit at most one report per target per day
ReportSchema.index({ reporter: 1, reported: 1, createdAt: -1 });

const Report: Model<IReport> =
  mongoose.models.Report ||
  mongoose.model<IReport>('Report', ReportSchema);

export default Report;
