import { Router } from 'express';
import { syncUser, generateJWT } from '../controllers/auth.controller.js';

const router = Router();

router.post('/sync', syncUser);
router.post('/jwt', generateJWT);

export default router;
