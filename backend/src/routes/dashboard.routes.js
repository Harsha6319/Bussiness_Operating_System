import { Router } from 'express';
import { STAFF_ROLES } from '../constants/roles.js';
import { dashboard } from '../controllers/dashboard.controller.js';
import { authorize, protect } from '../middleware/auth.middleware.js';

const router = Router();
router.get('/', protect, authorize(...STAFF_ROLES), dashboard);
export default router;
