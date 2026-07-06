import { Router } from 'express';
import { STAFF_ROLES } from '../constants/roles.js';
import {
  analytics,
  businessScore,
  customerAnalytics,
  dashboardAnalytics,
  employeeAnalytics,
  financeAnalytics,
  inventoryAnalytics,
  predictions,
  recommendations,
  salesAnalytics
} from '../controllers/analytics.controller.js';
import { authorize, protect } from '../middleware/auth.middleware.js';

const router = Router();
router.get('/', protect, authorize(...STAFF_ROLES), analytics);
router.get('/dashboard', protect, authorize(...STAFF_ROLES), dashboardAnalytics);
router.get('/sales', protect, authorize(...STAFF_ROLES), salesAnalytics);
router.get('/customers', protect, authorize(...STAFF_ROLES), customerAnalytics);
router.get('/inventory', protect, authorize(...STAFF_ROLES), inventoryAnalytics);
router.get('/finance', protect, authorize(...STAFF_ROLES), financeAnalytics);
router.get('/employees', protect, authorize(...STAFF_ROLES), employeeAnalytics);
router.get('/predictions', protect, authorize(...STAFF_ROLES), predictions);
router.get('/business-score', protect, authorize(...STAFF_ROLES), businessScore);
router.get('/recommendations', protect, authorize(...STAFF_ROLES), recommendations);
export default router;
