import { Router } from 'express';
import {
  createCheckoutSession,
  verifySession
} from '../controllers/payment.controller.js';
import { verifyToken } from '../middlewares/auth.js';

const router = Router();

router.post('/create-checkout', verifyToken, createCheckoutSession);
router.post('/verify-session', verifyToken, verifySession);

export default router;
