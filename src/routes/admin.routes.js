import { Router } from 'express';
import {
  getAdminStats,
  getAdminUsers,
  updateUserRole,
  getAdminTuitions,
  moderateTuition,
  getAdminTransactions
} from '../controllers/admin.controller.js';
import { verifyToken, verifyAdmin } from '../middlewares/auth.js';

const router = Router();

// All routes require valid token and admin role
router.use(verifyToken, verifyAdmin);

router.get('/stats', getAdminStats);
router.get('/users', getAdminUsers);
router.patch('/users/:id/role', updateUserRole);
router.get('/tuitions', getAdminTuitions);
router.patch('/tuitions/:id/moderate', moderateTuition);
router.get('/transactions', getAdminTransactions);

export default router;
