import { Router } from 'express';
import { ROLES, STAFF_ROLES } from '../constants/roles.js';
import { adjustStock, archiveProduct, createProduct, deleteProduct, getProduct, inventoryStats, listProducts, updateProduct } from '../controllers/product.controller.js';
import { authorize, protect } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { idParamSchema, productSchema, stockAdjustmentSchema } from '../validators/schemas.js';

const router = Router();
router.use(protect);
router.use(authorize(...STAFF_ROLES));
router.get('/stats', inventoryStats);
router.get('/', listProducts);
router.post('/', authorize(ROLES.OWNER, ROLES.MANAGER), validate(productSchema), createProduct);
router.get('/:id', validate(idParamSchema), getProduct);
router.put('/:id', authorize(ROLES.OWNER, ROLES.MANAGER), validate(idParamSchema.merge(productSchema)), updateProduct);
router.patch('/:id/stock', authorize(ROLES.OWNER, ROLES.MANAGER), validate(stockAdjustmentSchema), adjustStock);
router.post('/:id/archive', authorize(ROLES.OWNER, ROLES.MANAGER), validate(idParamSchema), archiveProduct);
router.delete('/:id', authorize(ROLES.OWNER), validate(idParamSchema), deleteProduct);
export default router;
