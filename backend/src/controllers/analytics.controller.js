import { analyticsService } from '../analytics/services/analytics.service.js';
import { businessScoreService } from '../analytics/services/businessScore.service.js';
import { predictionService } from '../analytics/services/prediction.service.js';
import { recommendationService } from '../analytics/services/recommendation.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const analytics = asyncHandler(async (req, res) => {
  const data = await analyticsService.executiveDashboard(req.organizationId, req.query.range || 'last30');
  res.json({ data });
});

export const dashboardAnalytics = analytics;

export const salesAnalytics = asyncHandler(async (req, res) => {
  res.json({ data: await analyticsService.salesAnalytics(req.organizationId, req.query.range || 'last30') });
});

export const customerAnalytics = asyncHandler(async (req, res) => {
  res.json({ data: await analyticsService.customerAnalytics(req.organizationId, req.query.range || 'last30') });
});

export const inventoryAnalytics = asyncHandler(async (req, res) => {
  res.json({ data: await analyticsService.inventoryAnalytics(req.organizationId) });
});

export const financeAnalytics = asyncHandler(async (req, res) => {
  res.json({ data: await analyticsService.financeAnalytics(req.organizationId, req.query.range || 'last30') });
});

export const employeeAnalytics = asyncHandler(async (req, res) => {
  res.json({ data: await analyticsService.employeeAnalytics(req.organizationId) });
});

export const predictions = asyncHandler(async (req, res) => {
  res.json({ data: await predictionService.predictions(req.organizationId) });
});

export const businessScore = asyncHandler(async (req, res) => {
  res.json({ data: await businessScoreService.calculate(req.organizationId) });
});

export const recommendations = asyncHandler(async (req, res) => {
  res.json({ data: await recommendationService.generate(req.organizationId) });
});
