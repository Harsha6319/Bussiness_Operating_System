import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, required: true, unique: true, index: true },
    businessName: { type: String, required: true, trim: true },
    businessLogo: String,
    profile: {
      industry: String,
      phone: String,
      email: String,
      address: String,
      currency: { type: String, default: 'USD' }
    },
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'light' },
    notifications: {
      lowStock: { type: Boolean, default: true },
      dailySummary: { type: Boolean, default: true },
      invoiceReminders: { type: Boolean, default: true }
    }
  },
  { timestamps: true }
);

export const Setting = mongoose.model('Setting', settingSchema);
