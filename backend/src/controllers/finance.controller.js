import { Transaction } from '../models/Transaction.js';
import { crudController } from './crud.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { buildQueryOptions, paginationMeta } from '../utils/query.js';
import { logActivity } from '../services/activity.service.js';
import { createNotification } from '../services/notification.service.js';
import { nextScopedCode } from '../utils/sequence.js';
import { ApiError } from '../utils/ApiError.js';

const base = crudController(Transaction, 'Transaction', ['category', 'description', 'invoiceNumber', 'transactionId', 'reference'], {
  beforeCreate: async (payload, req) => {
    payload.transactionId = await nextScopedCode(Transaction, req.organizationId, 'transactionId', 'TXN');
    payload.transactionDate = payload.occurredAt || new Date();
  },
  afterCreate: async (item, req) => {
    await logActivity({ organizationId: req.organizationId, actor: req.user._id, action: `${item.type} Added`, entity: 'Transaction', entityId: item._id });
    if (item.type === 'Expense' && item.amount >= 10000) {
      await createNotification({ organizationId: req.organizationId, title: 'Large expense', message: `${item.category} expense of ${item.amount} was added.`, type: 'Warning' });
    }
  }
});

export const createTransaction = base.create;
export const getTransaction = base.get;
export const updateTransaction = base.update;
export const deleteTransaction = base.remove;

export const listTransactions = asyncHandler(async (req, res) => {
  const { filters, page, limit, skip, sort } = buildQueryOptions(req.query, ['category', 'description', 'invoiceNumber']);
  const query = { organizationId: req.organizationId, deletedAt: { $exists: false }, ...filters };
  const [data, total] = await Promise.all([
    Transaction.find(query).sort(sort).skip(skip).limit(limit),
    Transaction.countDocuments(query)
  ]);
  res.json({ data, meta: paginationMeta(total, page, limit) });
});

export const financialSummary = asyncHandler(async (req, res) => {
  const summary = await Transaction.aggregate([
    { $match: { organizationId: req.organizationId, deletedAt: { $exists: false } } },
    { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } }
  ]);
  const grouped = await Transaction.aggregate([
    { $match: { organizationId: req.organizationId, deletedAt: { $exists: false } } },
    { $group: { _id: { type: '$type', category: '$category' }, total: { $sum: '$amount' } } },
    { $sort: { total: -1 } }
  ]);
  const totals = { income: 0, expenses: 0 };
  for (const row of summary) {
    if (row._id === 'Income') totals.income = row.total;
    if (row._id === 'Expense') totals.expenses = row.total;
  }
  res.json({ data: { ...totals, profit: totals.income - totals.expenses, categories: grouped } });
});

export const monthlySummary = asyncHandler(async (req, res) => {
  const data = await Transaction.aggregate([
    { $match: { organizationId: req.organizationId, deletedAt: { $exists: false } } },
    { $group: { _id: { month: { $dateToString: { format: '%Y-%m', date: '$occurredAt' } }, type: '$type' }, total: { $sum: '$amount' } } },
    { $sort: { '_id.month': 1 } }
  ]);
  res.json({ data });
});

export const generateInvoice = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findOne({ _id: req.params.id, organizationId: req.organizationId });
  if (!transaction) throw new ApiError(404, 'Transaction not found');
  if (!transaction.invoiceNumber) {
    transaction.invoiceNumber = `INV-${Date.now()}`;
    await transaction.save();
  }
  res.json({ data: transaction });
});
