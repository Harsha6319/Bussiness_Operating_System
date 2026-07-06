import { Router } from 'express';
import { ROLES, STAFF_ROLES } from '../constants/roles.js';
import { createCustomer, deleteCustomer, exportCustomers, getCustomer, importCustomers, listCustomers, updateCustomer } from '../controllers/customer.controller.js';
import { authorize, protect } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { customerSchema, idParamSchema } from '../validators/schemas.js';
import multer from 'multer';

const upload = multer({ dest: 'src/uploads/' });

const router = Router();
router.use(protect);
router.use(authorize(...STAFF_ROLES));
router.get('/export', exportCustomers);
router.post('/import', authorize(ROLES.OWNER, ROLES.MANAGER), upload.single('file'), importCustomers);
router.get('/', listCustomers);
router.post('/', authorize(ROLES.OWNER, ROLES.MANAGER, ROLES.EMPLOYEE), validate(customerSchema), createCustomer);
router.get('/:id', validate(idParamSchema), getCustomer);
router.put('/:id', authorize(ROLES.OWNER, ROLES.MANAGER), validate(idParamSchema.merge(customerSchema)), updateCustomer);
router.delete('/:id', authorize(ROLES.OWNER), validate(idParamSchema), deleteCustomer);
export default router;
