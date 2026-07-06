import { Router } from 'express';
import { ROLES } from '../constants/roles.js';
import { forgotPassword, inviteUser, login, logout, me, refresh, register, resetPassword } from '../controllers/auth.controller.js';
import { authorize, protect } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { authSchemas } from '../validators/schemas.js';

const router = Router();

router.post('/register', validate(authSchemas.register), register);
router.post('/login', validate(authSchemas.login), login);
router.post('/refresh', refresh);
router.post('/forgot-password', validate(authSchemas.forgotPassword), forgotPassword);
router.post('/reset-password', validate(authSchemas.resetPassword), resetPassword);
router.get('/me', protect, me);
router.get('/profile', protect, me);
router.post('/invite', protect, authorize(ROLES.OWNER, ROLES.MANAGER), validate(authSchemas.inviteUser), inviteUser);
router.post('/logout', protect, logout);

export default router;
