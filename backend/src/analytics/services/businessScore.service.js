import { BusinessScore } from '../../models/BusinessScore.js';
import { analyticsService } from './analytics.service.js';

function clamp(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export class BusinessScoreService {
  async calculate(organizationId) {
    const [dashboard, finance, inventory, customers] = await Promise.all([
      analyticsService.executiveDashboard(organizationId, 'last30'),
      analyticsService.financeAnalytics(organizationId, 'last30'),
      analyticsService.inventoryAnalytics(organizationId),
      analyticsService.customerAnalytics(organizationId, 'last30')
    ]);

    const sales = clamp(60 + dashboard.kpis.growthPercentage);
    const inventoryScore = clamp(100 - inventory.lowStock * 5 - inventory.outOfStock * 10);
    const financeScore = clamp(finance.netMargin + 70);
    const customerScore = clamp(50 + customers.repeatPurchaseRate - customers.inactiveCustomers.length);
    const operationsScore = clamp(100 - dashboard.kpis.pendingOrders * 2);
    const score = clamp((sales * 0.25) + (inventoryScore * 0.2) + (financeScore * 0.25) + (customerScore * 0.15) + (operationsScore * 0.15));

    const improvements = [];
    if (sales < 60) improvements.push('Improve revenue momentum with targeted campaigns.');
    if (inventoryScore < 70) improvements.push('Resolve low-stock and out-of-stock products.');
    if (financeScore < 70) improvements.push('Reduce expense ratio and protect margin.');
    if (customerScore < 70) improvements.push('Reactivate inactive customers and improve repeat purchase rate.');
    if (operationsScore < 70) improvements.push('Clear pending orders to improve operational health.');

    return BusinessScore.create({
      organizationId,
      score,
      components: { sales, inventory: inventoryScore, finance: financeScore, customers: customerScore, operations: operationsScore },
      explanation: `Business health is ${score}/100 based on sales momentum, inventory risk, margin, customer retention, and pending operations.`,
      improvements
    });
  }
}

export const businessScoreService = new BusinessScoreService();
