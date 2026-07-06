import mongoose from 'mongoose';

const recommendationSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    category: { type: String, enum: ['Sales', 'Inventory', 'Finance', 'Customer', 'Operations'], required: true },
    severity: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
    title: { type: String, required: true },
    insight: { type: String, required: true },
    recommendation: { type: String, required: true },
    status: { type: String, enum: ['Open', 'In Progress', 'Resolved', 'Dismissed'], default: 'Open' },
    sourceMetric: mongoose.Schema.Types.Mixed
  },
  { timestamps: true }
);

export const Recommendation = mongoose.model('Recommendation', recommendationSchema);
