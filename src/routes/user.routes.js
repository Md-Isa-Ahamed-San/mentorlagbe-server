import { Router } from 'express';
import {
  getCurrentUser,
  updateProfile,
  toggleBookmark,
  getSavedTuitions
} from '../controllers/user.controller.js';
import { verifyToken, verifyStudent } from '../middlewares/auth.js';

const router = Router();

router.get('/me', verifyToken, getCurrentUser);
router.patch('/profile', verifyToken, updateProfile);
router.patch('/bookmarks', verifyToken, verifyStudent, toggleBookmark);
router.get('/saved-tuitions', verifyToken, verifyStudent, getSavedTuitions);

export default router;
