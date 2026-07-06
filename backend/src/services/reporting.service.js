import { startOfDay, startOfMonth } from '../utils/date.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { Transaction } from '../models/Transaction.js';

export async function getBusinessSnapshot(organizationId) {
  const today = startOfDay(new Date());
  const monthStart = startOfMonth(new Date());

  const [todayOrders, todayRevenueAgg, expensesAgg, lowStock, recentActivities, monthlyRevenue, topProducts] = await Promise.all([
    Order.countDocuments({ organizationId, createdAt: { $gte: today }, status: { $ne: 'Cancelled' } }),
    Order.aggregate([
      { $match: { organizationId, createdAt: { $gte: today }, status: { $ne: 'Cancelled' } } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]),
    Transaction.aggregate([
      { $match: { organizationId, type: 'Expense', occurredAt: { $gte: today } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),
    Product.find({ organizationId, $expr: { $lte: ['$stockQuantity', '$lowStockThreshold'] } }).limit(8),
    ActivityLog.find({ organizationId }).sort('-createdAt').limit(8).populate('actor', 'name role'),
    Order.aggregate([
      { $match: { organizationId, createdAt: { $gte: monthStart }, status: { $ne: 'Cancelled' } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]),
    Order.aggregate([
      { $match: { organizationId, createdAt: { $gte: monthStart }, status: { $ne: 'Cancelled' } } },
      { $unwind: '$items' },
      { $group: { _id: '$items.product', name: { $first: '$items.name' }, quantity: { $sum: '$items.quantity' }, revenue: { $sum: '$items.total' } } },
      { $sort: { revenue: -1 } },
      { $limit: 5 }
    ])
  ]);

  const revenue = todayRevenueAgg[0]?.total || 0;
  const expenses = expensesAgg[0]?.total || 0;

  return {
    metrics: {
      todaySales: revenue,
      todayOrders,
      inventoryAlerts: lowStock.length,
      revenue,
      expenses,
      profit: revenue - expenses
    },
    lowStock,
    recentActivities,
    monthlyRevenue,
    topProducts
  };
}
