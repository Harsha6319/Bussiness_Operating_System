import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    productId: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    sku: { type: String, trim: true },
    category: { type: String, trim: true, default: 'General' },
    stockQuantity: { type: Number, required: true, min: 0, default: 0 },
    lowStockThreshold: { type: Number, default: 5, min: 0 },
    maximumStock: { type: Number, min: 0 },
    price: { type: Number, required: true, min: 0 },
    costPrice: { type: Number, min: 0, default: 0 },
    sellingPrice: { type: Number, min: 0 },
    purchasePrice: { type: Number, min: 0 },
    barcode: { type: String, trim: true },
    qrCode: { type: String, trim: true },
    imageUrl: String,
    images: [String],
    supplier: { type: String, trim: true },
    warehouse: { type: String, trim: true },
    expiryDate: Date,
    status: { type: String, enum: ['Active', 'Inactive', 'Archived'], default: 'Active', index: true },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    archivedAt: Date,
    archivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

productSchema.index({ organizationId: 1, productId: 1 }, { unique: true });
productSchema.index({ organizationId: 1, sku: 1 }, { unique: true, sparse: true });
productSchema.index({ organizationId: 1, name: 'text', category: 'text', barcode: 'text' });

productSchema.virtual('isLowStock').get(function isLowStock() {
  return this.stockQuantity <= this.lowStockThreshold;
});

productSchema.virtual('isOutOfStock').get(function isOutOfStock() {
  return this.stockQuantity === 0;
});

export const Product = mongoose.model('Product', productSchema);
