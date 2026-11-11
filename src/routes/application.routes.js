import { Router } from 'express';
import {
  createApplication,
  getStudentApplications,
  getTutorApplications,
  updateApplicationStatus,
  cancelApplication
} from '../controllers/application.controller.js';
import { verifyToken, verifyStudent, verifyTutor } from '../middlewares/auth.js';

const router = Router();

// Student routes
router.post('/', verifyToken, verifyStudent, createApplication);
router.get('/student', verifyToken, verifyStudent, getStudentApplications);
router.delete('/:id', verifyToken, verifyStudent, cancelApplication);

// Tutor routes
router.get('/tutor', verifyToken, verifyTutor, getTutorApplications);
router.patch('/:id/status', verifyToken, verifyTutor, updateApplicationStatus);

export default router;
