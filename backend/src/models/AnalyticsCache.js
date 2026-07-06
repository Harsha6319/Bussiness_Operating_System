import mongoose from 'mongoose';

const analyticsCacheSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    cacheKey: { type: String, required: true },
    scope: { type: String, required: true },
    params: mongoose.Schema.Types.Mixed,
    data: mongoose.Schema.Types.Mixed,
    expiresAt: { type: Date, required: true, index: true }
  },
  { timestamps: true }
);

analyticsCacheSchema.index({ organizationId: 1, cacheKey: 1 }, { unique: true });

export const AnalyticsCache = mongoose.model('AnalyticsCache', analyticsCacheSchema);
