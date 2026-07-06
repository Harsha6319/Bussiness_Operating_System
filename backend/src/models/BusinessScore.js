import mongoose from 'mongoose';

const businessScoreSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    score: { type: Number, required: true, min: 0, max: 100 },
    components: {
      sales: Number,
      inventory: Number,
      finance: Number,
      customers: Number,
      operations: Number
    },
    explanation: String,
    improvements: [String],
    calculatedFor: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const BusinessScore = mongoose.model('BusinessScore', businessScoreSchema);
