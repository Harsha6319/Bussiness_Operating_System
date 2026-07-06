import mongoose from 'mongoose';

const organizationSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: String, trim: true },
  logoUrl: { type: String },
  timezone: { type: String, default: 'UTC' },
  currency: { type: String, default: 'USD' },
  language: { type: String, default: 'en' },
  taxSettings: {
    taxRate: { type: Number, default: 0 },
    taxId: { type: String }
  },
  status: { type: String, enum: ['Active', 'Suspended', 'Trial', 'Canceled'], default: 'Trial' }
}, { timestamps: true });

export const Organization = mongoose.model('Organization', organizationSchema);
