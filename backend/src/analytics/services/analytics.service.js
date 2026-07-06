import { ActivityLog } from '../../models/ActivityLog.js';
import { Customer } from '../../models/Customer.js';
import { Order } from '../../models/Order.js';
import { Product } from '../../models/Product.js';
import { Transaction } from '../../models/Transaction.js';
import { User } from '../../models/User.js';
import { resolveDateRange, previousRange } from '../utils/dateRange.js';

function pct(current, previous) {
  if (!previous) return current ? 100 : 0;
  return Number((((current - previous) / previous) * 100).toFixed(2));
}

export class AnalyticsService {
  range(range) {
    return resolveDateRange(range);
  }

  async executiveDashboard(organizationId, range = 'last30') {
    const { start, end } = this.range(range);
    const prev = previousRange(start, end);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [
      todayRevenue,
      todayOrders,
      monthlyRevenue,
      monthlyExpenses,
      pendingOrders,
      inventoryAgg,
      lowStockProducts,
      outstandingPayments,
      activeCustomers,
      newCustomers,
      periodRevenue,
      previousRevenue,
      recentActivities,
      revenueTrend,
      ordersTrend,
      profitTrend,
      expenseTrend,
      customerGrowth,
      topProducts,
      topCustomers,
      paymentMethods,
      salesByCategory
    ] = await Promise.all([
      this.orderRevenue(organizationId, { createdAt: { $gte: today }, status: { $ne: 'Cancelled' } }),
      Order.countDocuments({ organizationId, createdAt: { $gte: today }, status: { $ne: 'Cancelled' }, deletedAt: { $exists: false } }),
      this.orderRevenue(organizationId, { createdAt: { $gte: monthStart }, status: { $ne: 'Cancelled' } }),
      this.transactionTotal(organizationId, { type: 'Expense', occurredAt: { $gte: monthStart } }),
      Order.countDocuments({ organizationId, status: { $in: ['Draft', 'Pending', 'Confirmed', 'Packed', 'Shipped'] }, deletedAt: { $exists: false } }),
      Product.aggregate([{ $match: { organizationId, status: { $ne: 'Archived' } } }, { $group: { _id: null, value: { $sum: { $multiply: ['$stockQuantity', '$price'] } }, products: { $sum: 1 } } }]),
      Product.countDocuments({ organizationId, status: { $ne: 'Archived' }, $expr: { $lte: ['$stockQuantity', '$lowStockThreshold'] } }),
      Customer.aggregate([{ $match: { organizationId, deletedAt: { $exists: false } } }, { $group: { _id: null, total: { $sum: '$outstandingBalance' } } }]),
      Customer.countDocuments({ organizationId, status: 'Active', deletedAt: { $exists: false } }),
      Customer.countDocuments({ organizationId, createdAt: { $gte: start, $lte: end }, deletedAt: { $exists: false } }),
      this.orderRevenue(organizationId, { createdAt: { $gte: start, $lte: end }, status: { $ne: 'Cancelled' } }),
      this.orderRevenue(organizationId, { createdAt: { $gte: prev.start, $lte: prev.end }, status: { $ne: 'Cancelled' } }),
      ActivityLog.find({ organizationId }).sort('-createdAt').limit(8).populate('actor', 'name role'),
      this.trend(organizationId, 'revenue', start, end),
      this.trend(organizationId, 'orders', start, end),
      this.profitTrend(organizationId, start, end),
      this.expenseTrend(organizationId, start, end),
      this.customerGrowth(organizationId, start, end),
      this.topProducts(organizationId, start, end),
      Customer.find({ organizationId, deletedAt: { $exists: false } }).sort('-totalSpend').limit(8).select('name totalSpend lastPurchaseAt'),
      Transaction.aggregate([{ $match: { organizationId, deletedAt: { $exists: false } } }, { $group: { _id: '$paymentMethod', amount: { $sum: '$amount' } } }]),
      this.salesByCategory(organizationId, start, end)
    ]);

    const revenue = periodRevenue;
    const inventoryValue = inventoryAgg[0]?.value || 0;
    const expenses = monthlyExpenses;

    return {
      kpis: {
        todayRevenue,
        todayOrders,
        monthlyRevenue,
        monthlyProfit: monthlyRevenue - expenses,
        pendingOrders,
        inventoryValue,
        lowStockProducts,
        outstandingPayments: outstandingPayments[0]?.total || 0,
        activeCustomers,
        newCustomers,
        growthPercentage: pct(revenue, previousRevenue)
      },
      charts: { revenueTrend, ordersTrend, profitTrend, expenseTrend, customerGrowth, topProducts, topCustomers, paymentMethods, salesByCategory },
      widgets: {
        recentActivities,
        todaysTasks: [
          { title: 'Review pending orders', count: pendingOrders },
          { title: 'Reorder low stock products', count: lowStockProducts },
          { title: 'Follow up outstanding payments', count: Math.round(outstandingPayments[0]?.total || 0) }
        ]
      }
    };
  }

  async orderRevenue(organizationId, match) {
    const [row] = await Order.aggregate([{ $match: { organizationId, deletedAt: { $exists: false }, ...match } }, { $group: { _id: null, total: { $sum: '$total' } } }]);
    return row?.total || 0;
  }

  async transactionTotal(organizationId, match) {
    const [row] = await Transaction.aggregate([{ $match: { organizationId, deletedAt: { $exists: false }, ...match } }, { $group: { _id: null, total: { $sum: '$amount' } } }]);
    return row?.total || 0;
  }

  async trend(organizationId, type, start, end) {
    return Order.aggregate([
      { $match: { organizationId, createdAt: { $gte: start, $lte: end }, status: { $ne: 'Cancelled' }, deletedAt: { $exists: false } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, value: { $sum: type === 'orders' ? 1 : '$total' } } },
      { $sort: { _id: 1 } }
    ]);
  }

  async profitTrend(organizationId, start, end) {
    const revenue = await this.trend(organizationId, 'revenue', start, end);
    const expenses = await this.expenseTrend(organizationId, start, end);
    const expenseMap = new Map(expenses.map((item) => [item._id, item.value]));
    return revenue.map((item) => ({ _id: item._id, value: item.value - (expenseMap.get(item._id) || 0) }));
  }

  async expenseTrend(organizationId, start, end) {
    return Transaction.aggregate([
      { $match: { organizationId, type: 'Expense', occurredAt: { $gte: start, $lte: end }, deletedAt: { $exists: false } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$occurredAt' } }, value: { $sum: '$amount' } } },
      { $sort: { _id: 1 } }
    ]);
  }

  async customerGrowth(organizationId, start, end) {
    return Customer.aggregate([
      { $match: { organizationId, createdAt: { $gte: start, $lte: end }, deletedAt: { $exists: false } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, value: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
  }

  async topProducts(organizationId, start, end, sort = -1) {
    return Order.aggregate([
      { $match: { organizationId, createdAt: { $gte: start, $lte: end }, status: { $ne: 'Cancelled' }, deletedAt: { $exists: false } } },
      { $unwind: '$items' },
      { $group: { _id: '$items.product', name: { $first: '$items.name' }, quantity: { $sum: '$items.quantity' }, revenue: { $sum: '$items.total' } } },
      { $sort: { quantity: sort } },
      { $limit: 10 }
    ]);
  }

  async salesByCategory(organizationId, start, end) {
    return Order.aggregate([
      { $match: { organizationId, createdAt: { $gte: start, $lte: end }, status: { $ne: 'Cancelled' }, deletedAt: { $exists: false } } },
      { $unwind: '$items' },
      { $lookup: { from: 'products', localField: 'items.product', foreignField: '_id', as: 'product' } },
      { $unwind: '$product' },
      { $group: { _id: '$product.category', revenue: { $sum: '$items.total' }, quantity: { $sum: '$items.quantity' } } },
      { $sort: { revenue: -1 } }
    ]);
  }

  async salesAnalytics(organizationId, range = 'last30') {
    const { start, end } = this.range(range);
    const [dailySales, bestSellingProducts, worstSellingProducts, topCategories, peakHours] = await Promise.all([
      this.trend(organizationId, 'revenue', start, end),
      this.topProducts(organizationId, start, end, -1),
      this.topProducts(organizationId, start, end, 1),
      this.salesByCategory(organizationId, start, end),
      Order.aggregate([
        { $match: { organizationId, createdAt: { $gte: start, $lte: end }, status: { $ne: 'Cancelled' }, deletedAt: { $exists: false } } },
        { $group: { _id: { $hour: '$createdAt' }, revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
        { $sort: { orders: -1 } }
      ])
    ]);
    const revenue = dailySales.reduce((sum, item) => sum + item.value, 0);
    const orders = dailySales.reduce((sum, item) => sum + (item.orders || 0), 0);
    return { dailySales, weeklySales: dailySales, monthlySales: dailySales, yearlySales: dailySales, averageOrderValue: orders ? revenue / orders : revenue, bestSellingProducts, worstSellingProducts, topCategories, peakHours, salesFunnel: [{ stage: 'Visitors', value: orders * 4 }, { stage: 'Leads', value: orders * 2 }, { stage: 'Orders', value: orders }] };
  }

  async customerAnalytics(organizationId, range = 'last30') {
    const { start, end } = this.range(range);
    const [newCustomers, returningCustomers, inactiveCustomers, highValueCustomers, totalCustomers] = await Promise.all([
      Customer.countDocuments({ organizationId, createdAt: { $gte: start, $lte: end }, deletedAt: { $exists: false } }),
      Order.distinct('customer', { organizationId, createdAt: { $gte: start, $lte: end }, deletedAt: { $exists: false } }),
      Customer.find({ organizationId, $or: [{ lastPurchaseAt: { $lt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) } }, { lastPurchaseAt: { $exists: false } }], deletedAt: { $exists: false } }).limit(20),
      Customer.find({ organizationId, deletedAt: { $exists: false } }).sort('-totalSpend').limit(10),
      Customer.countDocuments({ organizationId, deletedAt: { $exists: false } })
    ]);
    return { newCustomers, returningCustomers: returningCustomers.length, repeatPurchaseRate: totalCustomers ? Number(((returningCustomers.length / totalCustomers) * 100).toFixed(2)) : 0, inactiveCustomers, highValueCustomers, customerLifetimeValue: highValueCustomers.reduce((sum, customer) => sum + customer.totalSpend, 0) / (highValueCustomers.length || 1), segments: [{ name: 'VIP', value: highValueCustomers.length }, { name: 'Inactive', value: inactiveCustomers.length }, { name: 'New', value: newCustomers }] };
  }

  async inventoryAnalytics(organizationId) {
    const [summary, fastMovingProducts, slowMovingProducts, expiringProducts, warehouseDistribution] = await Promise.all([
      Product.aggregate([{ $match: { organizationId, status: { $ne: 'Archived' } } }, { $group: { _id: null, inventoryValue: { $sum: { $multiply: ['$stockQuantity', '$price'] } }, totalStock: { $sum: '$stockQuantity' }, lowStock: { $sum: { $cond: [{ $lte: ['$stockQuantity', '$lowStockThreshold'] }, 1, 0] } }, outOfStock: { $sum: { $cond: [{ $eq: ['$stockQuantity', 0] }, 1, 0] } } } }]),
      this.topProducts(organizationId, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date(), -1),
      this.topProducts(organizationId, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date(), 1),
      Product.find({ organizationId, expiryDate: { $lte: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), $gte: new Date() }, status: { $ne: 'Archived' } }).limit(20),
      Product.aggregate([{ $match: { organizationId, status: { $ne: 'Archived' } } }, { $group: { _id: '$warehouse', stock: { $sum: '$stockQuantity' }, value: { $sum: { $multiply: ['$stockQuantity', '$price'] } } } }])
    ]);
    return { ...(summary[0] || { inventoryValue: 0, totalStock: 0, lowStock: 0, outOfStock: 0 }), inventoryTurnover: fastMovingProducts.length, deadStock: slowMovingProducts.filter((item) => item.quantity === 0), fastMovingProducts, slowMovingProducts, expiringProducts, warehouseDistribution };
  }

  async financeAnalytics(organizationId, range = 'last30') {
    const { start, end } = this.range(range);
    const [income, expenses, expenseBreakdown, incomeSources, cashFlow] = await Promise.all([
      this.transactionTotal(organizationId, { type: 'Income', occurredAt: { $gte: start, $lte: end } }),
      this.transactionTotal(organizationId, { type: 'Expense', occurredAt: { $gte: start, $lte: end } }),
      Transaction.aggregate([{ $match: { organizationId, type: 'Expense', occurredAt: { $gte: start, $lte: end }, deletedAt: { $exists: false } } }, { $group: { _id: '$category', value: { $sum: '$amount' } } }, { $sort: { value: -1 } }]),
      Transaction.aggregate([{ $match: { organizationId, type: 'Income', occurredAt: { $gte: start, $lte: end }, deletedAt: { $exists: false } } }, { $group: { _id: '$category', value: { $sum: '$amount' } } }, { $sort: { value: -1 } }]),
      Transaction.aggregate([{ $match: { organizationId, occurredAt: { $gte: start, $lte: end }, deletedAt: { $exists: false } } }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$occurredAt' } }, income: { $sum: { $cond: [{ $eq: ['$type', 'Income'] }, '$amount', 0] } }, expenses: { $sum: { $cond: [{ $eq: ['$type', 'Expense'] }, '$amount', 0] } } } }, { $sort: { _id: 1 } }])
    ]);
    const profit = income - expenses;
    return { revenue: income, expenses, profit, cashFlow, grossMargin: income ? Number(((profit / income) * 100).toFixed(2)) : 0, netMargin: income ? Number(((profit / income) * 100).toFixed(2)) : 0, expenseBreakdown, incomeSources, financialHealth: profit >= 0 ? 'Healthy' : 'Needs Attention' };
  }

  async employeeAnalytics(organizationId) {
    const users = await User.find({ organizationId, role: { $in: ['Owner', 'Manager', 'Employee'] } }).select('name role email createdAt');
    const processed = await Order.aggregate([{ $match: { organizationId, createdBy: { $exists: true }, deletedAt: { $exists: false } } }, { $group: { _id: '$createdBy', ordersProcessed: { $sum: 1 }, revenue: { $sum: '$total' } } }]);
    const map = new Map(processed.map((item) => [String(item._id), item]));
    return users.map((user) => ({ id: user._id, name: user.name, role: user.role, ordersProcessed: map.get(String(user._id))?.ordersProcessed || 0, revenue: map.get(String(user._id))?.revenue || 0, taskCompletion: 0, workload: 'Normal' })).sort((a, b) => b.ordersProcessed - a.ordersProcessed);
  }
}

export const analyticsService = new AnalyticsService();
