import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    transactionId: { type: String, required: true },
    type: { type: String, enum: ['Income', 'Expense'], required: true },
    category: { type: String, required: true, trim: true },
    reference: { type: String, trim: true },
    amount: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, enum: ['Cash', 'UPI', 'Card', 'Bank'], default: 'Cash' },
    description: { type: String, trim: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    invoiceNumber: String,
    occurredAt: { type: Date, default: Date.now },
    transactionDate: { type: Date, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    deletedAt: Date,
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

transactionSchema.index({ organizationId: 1, transactionId: 1 }, { unique: true });
transactionSchema.index({ organizationId: 1, type: 1, occurredAt: -1 });

export const Transaction = mongoose.model('Transaction', transactionSchema);
