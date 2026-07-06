import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  plan: { type: String, enum: ['Free', 'Starter', 'Professional', 'Enterprise'], default: 'Free' },
  status: { type: String, enum: ['Trial', 'Active', 'PastDue', 'Canceled'], default: 'Trial' },
  usageLimits: {
    storageBytes: { type: Number, default: 5368709120 }, // 5GB
    aiTokens: { type: Number, default: 100000 },
    users: { type: Number, default: 5 }
  },
  currentUsage: {
    storageBytes: { type: Number, default: 0 },
    aiTokens: { type: Number, default: 0 },
    users: { type: Number, default: 1 }
  },
  billingCycle: { type: String, enum: ['Monthly', 'Yearly'], default: 'Monthly' },
  renewDate: { type: Date },
  stripeCustomerId: { type: String },
  stripeSubscriptionId: { type: String }
}, { timestamps: true });

export const Subscription = mongoose.model('Subscription', subscriptionSchema);
