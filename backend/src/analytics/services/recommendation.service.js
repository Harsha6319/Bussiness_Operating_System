import { Recommendation } from '../../models/Recommendation.js';
import { analyticsService } from './analytics.service.js';
import { predictionService } from './prediction.service.js';

export class RecommendationService {
  async generate(organizationId) {
    const [dashboard, finance, inventory, customers, predictions] = await Promise.all([
      analyticsService.executiveDashboard(organizationId, 'last30'),
      analyticsService.financeAnalytics(organizationId, 'last30'),
      analyticsService.inventoryAnalytics(organizationId),
      analyticsService.customerAnalytics(organizationId, 'last30'),
      predictionService.predictions(organizationId)
    ]);

    const recommendations = [];
    if (dashboard.kpis.growthPercentage < 0) {
      recommendations.push({
        category: 'Sales',
        severity: 'High',
        title: 'Revenue momentum dropped',
        insight: `Revenue changed by ${dashboard.kpis.growthPercentage}% versus the previous period.`,
        recommendation: 'Run a focused promotion for top products and follow up with recent high-value customers.',
        sourceMetric: { growthPercentage: dashboard.kpis.growthPercentage }
      });
    }
    if (inventory.lowStock > 0 || inventory.outOfStock > 0) {
      recommendations.push({
        category: 'Inventory',
        severity: inventory.outOfStock ? 'Critical' : 'High',
        title: 'Stock risk needs attention',
        insight: `${inventory.lowStock} low-stock products and ${inventory.outOfStock} out-of-stock products detected.`,
        recommendation: 'Create purchase recommendations for fast-moving and low-stock products before demand catches up.',
        sourceMetric: { lowStock: inventory.lowStock, outOfStock: inventory.outOfStock }
      });
    }
    if (finance.expenses > finance.revenue * 0.7 && finance.revenue > 0) {
      recommendations.push({
        category: 'Finance',
        severity: 'Medium',
        title: 'Expense ratio is elevated',
        insight: `Expenses are ${Math.round((finance.expenses / finance.revenue) * 100)}% of revenue.`,
        recommendation: 'Review the top three expense categories and set approval thresholds for large spends.',
        sourceMetric: { expenses: finance.expenses, revenue: finance.revenue }
      });
    }
    if (customers.inactiveCustomers.length > 0) {
      recommendations.push({
        category: 'Customer',
        severity: 'Medium',
        title: 'Inactive customers are growing',
        insight: `${customers.inactiveCustomers.length} customers have not purchased recently.`,
        recommendation: 'Send loyalty offers to inactive and high-value customers with a 7-day expiry.',
        sourceMetric: { inactiveCustomers: customers.inactiveCustomers.length }
      });
    }
    if (predictions.expectedRevenueNextMonth > dashboard.kpis.monthlyRevenue * 1.1) {
      recommendations.push({
        category: 'Operations',
        severity: 'Low',
        title: 'Prepare for higher demand',
        insight: 'Forecast suggests next-month revenue may exceed current monthly revenue.',
        recommendation: 'Check staffing and inventory coverage for best-selling products.',
        sourceMetric: { expectedRevenueNextMonth: predictions.expectedRevenueNextMonth }
      });
    }

    await Recommendation.deleteMany({ organizationId, status: 'Open' });
    return Recommendation.insertMany(recommendations.map((item) => ({ ...item, organizationId })));
  }
}

export const recommendationService = new RecommendationService();
