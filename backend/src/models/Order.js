import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    orderNumber: { type: String, required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    items: [orderItemSchema],
    subtotal: { type: Number, required: true, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    grandTotal: { type: Number, min: 0 },
    status: { type: String, enum: ['Draft', 'Pending', 'Confirmed', 'Packed', 'Shipped', 'Delivered', 'Cancelled'], default: 'Confirmed' },
    paymentStatus: { type: String, enum: ['Pending', 'Paid', 'Partial', 'Refunded', 'Unpaid'], default: 'Pending' },
    invoiceNumber: String,
    notes: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    deletedAt: Date,
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    orderedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

orderSchema.index({ organizationId: 1, orderNumber: 1 }, { unique: true });

export const Order = mongoose.model('Order', orderSchema);
