import { PredictionLog } from '../../models/PredictionLog.js';
import { analyticsService } from './analytics.service.js';

function average(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

export class PredictionService {
  async predictions(organizationId) {
    const dashboard = await analyticsService.executiveDashboard(organizationId, 'last30');
    const salesValues = dashboard.charts.revenueTrend.map((item) => item.value);
    const avgRevenue = average(salesValues);
    const growth = dashboard.kpis.growthPercentage / 100;
    const expectedRevenueNextMonth = Math.max(avgRevenue * 30 * (1 + growth), 0);
    const demandForecast = dashboard.charts.topProducts.map((product) => ({
      product: product.name,
      expectedUnits: Math.ceil((product.quantity || 0) * 1.15),
      confidence: 0.72
    }));
    const inventoryForecast = demandForecast.map((item) => ({ product: item.product, recommendedStock: item.expectedUnits * 2 }));
    const profitForecast = Math.max(expectedRevenueNextMonth - dashboard.kpis.monthlyRevenue + dashboard.kpis.monthlyProfit, 0);

    const prediction = {
      expectedRevenueNextMonth,
      demandForecast,
      inventoryForecast,
      profitForecast,
      seasonalTrends: 'Heuristic baseline uses recent revenue momentum. Future ML models can replace this service.',
      customerChurnRisk: dashboard.kpis.activeCustomers ? Math.max(0, 100 - dashboard.kpis.growthPercentage) : 0,
      employeeWorkloadPrediction: dashboard.kpis.pendingOrders > 20 ? 'High' : 'Normal'
    };

    await PredictionLog.create({ organizationId, type: 'executive-forecast', input: dashboard.kpis, prediction, confidence: 0.7 });
    return prediction;
  }
}

export const predictionService = new PredictionService();
