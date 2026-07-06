import mongoose from 'mongoose';

const predictionLogSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    type: { type: String, required: true },
    input: mongoose.Schema.Types.Mixed,
    prediction: mongoose.Schema.Types.Mixed,
    confidence: Number,
    model: { type: String, default: 'heuristic-v1' }
  },
  { timestamps: true }
);

export const PredictionLog = mongoose.model('PredictionLog', predictionLogSchema);
