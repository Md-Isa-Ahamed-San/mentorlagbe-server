import { Router } from 'express';
import {
  getStudentStats,
  getTutorStats
} from '../controllers/stats.controller.js';
import { verifyToken, verifyStudent, verifyTutor } from '../middlewares/auth.js';

const router = Router();

router.get('/student', verifyToken, verifyStudent, getStudentStats);
router.get('/tutor', verifyToken, verifyTutor, getTutorStats);

export default router;
