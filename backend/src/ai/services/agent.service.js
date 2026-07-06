import { AgentTask } from '../../models/AgentTask.js';
import { Product } from '../../models/Product.js';
import { Transaction } from '../../models/Transaction.js';
import { WorkflowLog } from '../../models/WorkflowLog.js';
import { createNotification } from '../../services/notification.service.js';

export class AgentService {
  async run({ organizationId, userId, workflow }) {
    const log = await WorkflowLog.create({ organizationId, workflow, status: 'Running', triggeredBy: userId, steps: [] });

    try {
      let result = {};
      if (workflow === 'low-stock') result = await this.lowStockWorkflow(organizationId, userId, log);
      else if (workflow === 'large-expense') result = await this.largeExpenseWorkflow(organizationId, userId, log);
      else if (workflow === 'new-order') result = { message: 'New order workflow is handled synchronously by the order service.' };
      else result = { message: 'Workflow registered for future agent execution.' };

      log.status = 'Completed';
      log.result = result;
      log.steps.push({ name: 'Complete workflow', status: 'Completed', message: 'Workflow finished', completedAt: new Date() });
      await log.save();
      return log;
    } catch (error) {
      log.status = 'Failed';
      log.error = error.message;
      await log.save();
      throw error;
    }
  }

  async lowStockWorkflow(organizationId, userId, log) {
    const products = await Product.find({ organizationId, status: { $ne: 'Archived' }, $expr: { $lte: ['$stockQuantity', { $ifNull: ['$lowStockThreshold', 5] }] } }).limit(20);
    log.steps.push({ name: 'Detect low stock', status: 'Completed', message: `${products.length} products need review`, completedAt: new Date() });
    const tasks = await AgentTask.insertMany(products.map((product) => ({
      organizationId,
      agent: 'inventory-agent',
      taskType: 'purchase-recommendation',
      status: 'Pending',
      input: { product: product._id, currentStock: product.stockQuantity, recommendedQuantity: Math.max((product.maximumStock || 100) - product.stockQuantity, 0) },
      assignedToRole: 'Manager',
      createdBy: userId
    })));
    await createNotification({ organizationId, title: 'Purchase recommendations ready', message: `${tasks.length} low-stock recommendations generated.`, type: 'Warning' });
    return { recommendations: tasks.length };
  }

  async largeExpenseWorkflow(organizationId, userId, log) {
    const expenses = await Transaction.find({ organizationId, type: 'Expense', amount: { $gte: 10000 } }).sort('-createdAt').limit(10);
    log.steps.push({ name: 'Review expenses', status: 'Completed', message: `${expenses.length} large expenses found`, completedAt: new Date() });
    await createNotification({ organizationId, title: 'Large expense review', message: `${expenses.length} large expenses require owner review.`, type: 'Warning' });
    return { largeExpenses: expenses.length };
  }

  async logs({ organizationId }) {
    return WorkflowLog.find({ organizationId }).sort('-createdAt').limit(50);
  }
}

export const agentService = new AgentService();
