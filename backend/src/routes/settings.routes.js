import { Router } from 'express';
import { ROLES } from '../constants/roles.js';
import { getSettings, updateSettings } from '../controllers/settings.controller.js';
import { authorize, protect } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { settingsSchema } from '../validators/schemas.js';

const router = Router();
router.use(protect);
router.get('/', getSettings);
router.put('/', authorize(ROLES.OWNER), validate(settingsSchema), updateSettings);
export default router;
