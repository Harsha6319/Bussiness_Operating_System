import { Router } from 'express';
import aiRoutes from './ai.routes.js';
import analyticsRoutes from './analytics.routes.js';
import authRoutes from './auth.routes.js';
import customerRoutes from './customer.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import financeRoutes from './finance.routes.js';
import orderRoutes from './order.routes.js';
import productRoutes from './product.routes.js';
import settingsRoutes from './settings.routes.js';

const router = Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'ai-bos-api', timestamp: new Date().toISOString() });
});

router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/customers', customerRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/finance', financeRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/ai', aiRoutes);
router.use('/settings', settingsRoutes);

export default router;
