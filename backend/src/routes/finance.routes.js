import { Router } from 'express';
import { ROLES, STAFF_ROLES } from '../constants/roles.js';
import { createTransaction, deleteTransaction, financialSummary, generateInvoice, getTransaction, listTransactions, monthlySummary, updateTransaction } from '../controllers/finance.controller.js';
import { authorize, protect } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { idParamSchema, transactionSchema } from '../validators/schemas.js';

const router = Router();
router.use(protect);
router.use(authorize(...STAFF_ROLES));
router.get('/summary', financialSummary);
router.get('/monthly-summary', monthlySummary);
router.get('/', listTransactions);
router.post('/', authorize(ROLES.OWNER, ROLES.MANAGER), validate(transactionSchema), createTransaction);
router.get('/:id', validate(idParamSchema), getTransaction);
router.put('/:id', authorize(ROLES.OWNER, ROLES.MANAGER), validate(idParamSchema.merge(transactionSchema)), updateTransaction);
router.delete('/:id', authorize(ROLES.OWNER), validate(idParamSchema), deleteTransaction);
router.post('/:id/invoice', authorize(ROLES.OWNER, ROLES.MANAGER), validate(idParamSchema), generateInvoice);
export default router;
