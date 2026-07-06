import { Router } from 'express';
import { ROLES, STAFF_ROLES } from '../constants/roles.js';
import { cancelOrder, createOrder, deleteOrder, listOrders, orderStats, updateOrderStatus } from '../controllers/order.controller.js';
import { authorize, protect } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { idParamSchema, orderSchema, orderStatusSchema } from '../validators/schemas.js';

const router = Router();
router.use(protect);
router.use(authorize(...STAFF_ROLES));
router.get('/stats', orderStats);
router.get('/', listOrders);
router.post('/', authorize(ROLES.OWNER, ROLES.MANAGER, ROLES.EMPLOYEE), validate(orderSchema), createOrder);
router.patch('/:id/status', authorize(ROLES.OWNER, ROLES.MANAGER), validate(orderStatusSchema), updateOrderStatus);
router.post('/:id/cancel', authorize(ROLES.OWNER, ROLES.MANAGER), validate(idParamSchema), cancelOrder);
router.delete('/:id', authorize(ROLES.OWNER), validate(idParamSchema), deleteOrder);
export default router;
