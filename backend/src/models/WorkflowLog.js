import mongoose from 'mongoose';

const workflowLogSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    workflow: { type: String, required: true },
    status: { type: String, enum: ['Queued', 'Running', 'Completed', 'Failed'], default: 'Queued' },
    steps: [{ name: String, status: String, message: String, completedAt: Date }],
    result: mongoose.Schema.Types.Mixed,
    error: String,
    triggeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

export const WorkflowLog = mongoose.model('WorkflowLog', workflowLogSchema);
