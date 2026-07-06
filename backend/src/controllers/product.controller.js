import { Product } from '../models/Product.js';
import { crudController } from './crud.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { logActivity } from '../services/activity.service.js';
import { createNotification } from '../services/notification.service.js';
import { nextScopedCode } from '../utils/sequence.js';

async function stockNotifications(product, req) {
  if (product.stockQuantity === 0) {
    await createNotification({ organizationId: req.organizationId, title: 'Out of stock', message: `${product.name} is out of stock.`, type: 'Warning' });
  } else if (product.stockQuantity <= product.lowStockThreshold) {
    await createNotification({ organizationId: req.organizationId, title: 'Low stock', message: `${product.name} has ${product.stockQuantity} units left.`, type: 'Warning' });
  }
}

const base = crudController(Product, 'Product', ['name', 'category', 'barcode', 'sku', 'productId'], {
  beforeCreate: async (payload, req) => {
    payload.productId = await nextScopedCode(Product, req.organizationId, 'productId', 'PRD');
    payload.sellingPrice = payload.sellingPrice ?? payload.price;
    payload.purchasePrice = payload.purchasePrice ?? payload.costPrice;
  },
  afterCreate: async (item, req) => {
    await logActivity({ organizationId: req.organizationId, actor: req.user._id, action: 'Product Added', entity: 'Product', entityId: item._id });
    await stockNotifications(item, req);
  },
  afterUpdate: async (item, req) => {
    await logActivity({ organizationId: req.organizationId, actor: req.user._id, action: 'Stock Updated', entity: 'Product', entityId: item._id });
    await stockNotifications(item, req);
  }
});

export const listProducts = base.list;
export const getProduct = base.get;
export const createProduct = base.create;
export const updateProduct = base.update;
export const deleteProduct = base.remove;

export const inventoryStats = asyncHandler(async (req, res) => {
  const [stats] = await Product.aggregate([
    { $match: { organizationId: req.organizationId, isActive: true, status: { $ne: 'Archived' } } },
    {
      $group: {
        _id: null,
        products: { $sum: 1 },
        units: { $sum: '$stockQuantity' },
        inventoryValue: { $sum: { $multiply: ['$stockQuantity', '$price'] } },
        lowStock: { $sum: { $cond: [{ $and: [{ $gt: ['$stockQuantity', 0] }, { $lte: ['$stockQuantity', '$lowStockThreshold'] }] }, 1, 0] } },
        outOfStock: { $sum: { $cond: [{ $eq: ['$stockQuantity', 0] }, 1, 0] } },
        categories: { $addToSet: '$category' }
      }
    }
  ]);
  res.json({ data: stats ? { ...stats, categories: stats.categories.length } : { products: 0, units: 0, inventoryValue: 0, lowStock: 0, outOfStock: 0, categories: 0 } });
});

export const archiveProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOneAndUpdate(
    { _id: req.params.id, organizationId: req.organizationId },
    { status: 'Archived', isActive: false, archivedAt: new Date(), archivedBy: req.user._id },
    { new: true }
  );
  if (!product) throw new ApiError(404, 'Product not found');
  res.json({ data: product });
});

export const adjustStock = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, organizationId: req.organizationId, status: { $ne: 'Archived' } });
  if (!product) throw new ApiError(404, 'Product not found');
  product.stockQuantity += req.body.quantity;
  if (product.stockQuantity < 0) product.stockQuantity = 0;
  product.updatedBy = req.user._id;
  await product.save();
  await logActivity({ organizationId: req.organizationId, actor: req.user._id, action: 'Stock Updated', entity: 'Product', entityId: product._id, metadata: { adjustment: req.body.quantity, reason: req.body.reason } });
  await stockNotifications(product, req);
  res.json({ data: product });
});
