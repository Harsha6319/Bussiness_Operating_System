import mongoose from 'mongoose';

const aiReportSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    type: { type: String, enum: ['sales', 'inventory', 'customer', 'finance', 'orders', 'business', 'weekly', 'monthly'], required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    format: { type: String, enum: ['markdown', 'text', 'pdf'], default: 'markdown' },
    generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    metadata: mongoose.Schema.Types.Mixed
  },
  { timestamps: true }
);

export const AIReport = mongoose.model('AIReport', aiReportSchema);
