import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    customerId: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },
    address: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      postalCode: String,
      country: String
    },
    gstNumber: { type: String, trim: true },
    customerType: { type: String, enum: ['Individual', 'Business'], default: 'Individual' },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active', index: true },
    notes: String,
    tags: [{ type: String, trim: true }],
    totalSpend: { type: Number, default: 0 },
    outstandingBalance: { type: Number, default: 0 },
    lastPurchaseAt: Date,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    deletedAt: Date,
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

customerSchema.index({ organizationId: 1, customerId: 1 }, { unique: true });
customerSchema.index({ organizationId: 1, name: 'text', email: 'text', phone: 'text' });
customerSchema.index({ organizationId: 1, email: 1 }, { sparse: true });
customerSchema.index({ organizationId: 1, phone: 1 }, { sparse: true });

export const Customer = mongoose.model('Customer', customerSchema);
