import { Router } from 'express';
import {
  getAllTuitions,
  getFeaturedTuitions,
  getTuitionById,
  getTutorMyTuitions,
  createTuition,
  updateTuition,
  deleteTuition,
  toggleTuitionStatus,
  addReview
} from '../controllers/tuition.controller.js';
import { verifyToken, verifyTutor, verifyStudent } from '../middlewares/auth.js';

const router = Router();

// Public routes
router.get('/', getAllTuitions);
router.get('/featured', getFeaturedTuitions);
router.get('/my-tuitions', verifyToken, verifyTutor, getTutorMyTuitions);
router.get('/:id', getTuitionById);

// Tutor protected routes
router.post('/', verifyToken, verifyTutor, createTuition);
router.patch('/:id', verifyToken, verifyTutor, updateTuition);
router.put('/:id', verifyToken, verifyTutor, updateTuition);
router.delete('/:id', verifyToken, verifyTutor, deleteTuition);
router.patch('/:id/toggle', verifyToken, verifyTutor, toggleTuitionStatus);
router.patch('/:id/status', verifyToken, verifyTutor, toggleTuitionStatus);

// Student review route
router.post('/:id/reviews', verifyToken, verifyStudent, addReview);

export default router;
