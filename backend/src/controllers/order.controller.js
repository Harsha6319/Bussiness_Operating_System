import { Customer } from '../models/Customer.js';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { Transaction } from '../models/Transaction.js';
import { logActivity } from '../services/activity.service.js';
import { createNotification } from '../services/notification.service.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { buildQueryOptions, paginationMeta } from '../utils/query.js';
import { nextScopedCode } from '../utils/sequence.js';

async function nextOrderNumber(organizationId) {
  const count = await Order.countDocuments({ organizationId });
  return `ORD-${String(count + 1).padStart(6, '0')}`;
}

export const listOrders = asyncHandler(async (req, res) => {
  const { filters, page, limit, skip, sort } = buildQueryOptions(req.query, []);
  const query = { organizationId: req.organizationId, deletedAt: { $exists: false }, ...filters };
  const [orders, total] = await Promise.all([
    Order.find(query).populate('customer', 'name phone email').sort(sort).skip(skip).limit(limit),
    Order.countDocuments(query)
  ]);
  res.json({ data: orders, meta: paginationMeta(total, page, limit) });
});

export const createOrder = asyncHandler(async (req, res) => {
  const customer = await Customer.findOne({ _id: req.body.customer, organizationId: req.organizationId });
  if (!customer) throw new ApiError(404, 'Customer not found');

  const productIds = req.body.items.map((item) => item.product);
  const products = await Product.find({ _id: { $in: productIds }, organizationId: req.organizationId, isActive: true, status: { $ne: 'Archived' } });
  const productMap = new Map(products.map((product) => [String(product._id), product]));

  const items = req.body.items.map((item) => {
    const product = productMap.get(item.product);
    if (!product) throw new ApiError(404, `Product ${item.product} not found`);
    if (product.stockQuantity < item.quantity) throw new ApiError(409, `${product.name} has insufficient stock`);
    const itemDiscount = item.discount || 0;
    const itemTax = item.tax || 0;
    return { product: product._id, name: product.name, quantity: item.quantity, unitPrice: product.price, discount: itemDiscount, tax: itemTax, total: (product.price * item.quantity) + itemTax - itemDiscount };
  });

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const tax = req.body.tax || 0;
  const discount = req.body.discount || 0;
  const total = Math.max(subtotal + tax - discount, 0);

  const order = await Order.create({
    organizationId: req.organizationId,
    orderNumber: await nextOrderNumber(req.organizationId),
    customer: customer._id,
    items,
    subtotal,
    tax,
    discount,
    total,
    grandTotal: total,
    paymentStatus: req.body.paymentStatus || 'Pending',
    invoiceNumber: `INV-${Date.now()}`,
    createdBy: req.user._id,
    notes: req.body.notes
  });

  await Promise.all(items.map((item) => Product.updateOne({ _id: item.product }, { $inc: { stockQuantity: -item.quantity } })));
  await Customer.updateOne({ _id: customer._id }, { $inc: { totalSpend: total }, lastPurchaseAt: new Date() });
  if (order.paymentStatus === 'Paid') {
    await Transaction.create({ organizationId: req.organizationId, transactionId: await nextScopedCode(Transaction, req.organizationId, 'transactionId', 'TXN'), type: 'Income', category: 'Sales', amount: total, order: order._id, invoiceNumber: order.invoiceNumber, createdBy: req.user._id, description: `Order ${order.orderNumber}` });
  } else {
    await Customer.updateOne({ _id: customer._id }, { $inc: { outstandingBalance: total } });
  }
  await logActivity({ organizationId: req.organizationId, actor: req.user._id, action: 'Order Created', entity: 'Order', entityId: order._id });
  await createNotification({ organizationId: req.organizationId, title: 'New order', message: `${order.orderNumber} created for ${customer.name}.`, type: 'Success' });

  res.status(201).json({ data: await order.populate('customer', 'name phone email') });
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, organizationId: req.organizationId });
  if (!order) throw new ApiError(404, 'Order not found');
  if (order.status === 'Cancelled') throw new ApiError(409, 'Cancelled orders cannot be updated');
  Object.assign(order, req.body);
  order.updatedBy = req.user._id;
  await order.save();
  res.json({ data: order });
});

export const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, organizationId: req.organizationId });
  if (!order) throw new ApiError(404, 'Order not found');
  if (order.status !== 'Cancelled') {
    order.status = 'Cancelled';
    order.updatedBy = req.user._id;
    await order.save();
    await Promise.all(order.items.map((item) => Product.updateOne({ _id: item.product }, { $inc: { stockQuantity: item.quantity } })));
    await logActivity({ organizationId: req.organizationId, actor: req.user._id, action: 'Order Cancelled', entity: 'Order', entityId: order._id });
    await createNotification({ organizationId: req.organizationId, title: 'Order cancelled', message: `${order.orderNumber} was cancelled and inventory restored.`, type: 'Warning' });
  }
  res.json({ data: order });
});

export const deleteOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOneAndUpdate(
    { _id: req.params.id, organizationId: req.organizationId, deletedAt: { $exists: false } },
    { deletedAt: new Date(), deletedBy: req.user._id },
    { new: true }
  );
  if (!order) throw new ApiError(404, 'Order not found');
  res.json({ data: order });
});

export const orderStats = asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [stats] = await Order.aggregate([
    { $match: { organizationId: req.organizationId, deletedAt: { $exists: false } } },
    {
      $group: {
        _id: null,
        todayOrders: { $sum: { $cond: [{ $gte: ['$createdAt', today] }, 1, 0] } },
        pendingOrders: { $sum: { $cond: [{ $in: ['$status', ['Draft', 'Pending', 'Confirmed', 'Packed', 'Shipped']] }, 1, 0] } },
        completedOrders: { $sum: { $cond: [{ $eq: ['$status', 'Delivered'] }, 1, 0] } },
        cancelledOrders: { $sum: { $cond: [{ $eq: ['$status', 'Cancelled'] }, 1, 0] } },
        revenue: { $sum: { $cond: [{ $ne: ['$status', 'Cancelled'] }, '$total', 0] } }
      }
    }
  ]);
  res.json({ data: stats || { todayOrders: 0, pendingOrders: 0, completedOrders: 0, cancelledOrders: 0, revenue: 0 } });
});
