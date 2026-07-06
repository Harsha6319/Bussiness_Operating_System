import mongoose from 'mongoose';

const branchSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  name: { type: String, required: true, trim: true },
  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  address: {
    street: String,
    city: String,
    state: String,
    zip: String,
    country: String
  },
  phone: String,
  email: String,
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export const Branch = mongoose.model('Branch', branchSchema);
