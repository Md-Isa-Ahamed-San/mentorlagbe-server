import jwt from 'jsonwebtoken';
import { getDB } from '../config/db.js';

/**
 * Verify JWT token from Authorization header
 */
export const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'mentorlagbe_super_secret_jwt_key_2024';
    const decoded = jwt.verify(token, secret);

    req.user = decoded; // { email, role, ... }
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.',
      error: error.message
    });
  }
};

/**
 * Verify that authenticated user has role 'student'
 */
export const verifyStudent = async (req, res, next) => {
  try {
    if (!req.user || !req.user.email) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. User information missing.'
      });
    }

    const db = getDB();
    const user = await db.collection('users').findOne({ email: req.user.email });

    if (!user || user.role !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. Student access required.'
      });
    }

    req.currentUser = user;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to verify student permissions.',
      error: error.message
    });
  }
};

/**
 * Verify that authenticated user has role 'tutor'
 */
export const verifyTutor = async (req, res, next) => {
  try {
    if (!req.user || !req.user.email) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. User information missing.'
      });
    }

    const db = getDB();
    const user = await db.collection('users').findOne({ email: req.user.email });

    if (!user || user.role !== 'tutor') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. Tutor access required.'
      });
    }

    req.currentUser = user;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to verify tutor permissions.',
      error: error.message
    });
  }
};

/**
 * Verify that authenticated user has role 'admin'
 */
export const verifyAdmin = async (req, res, next) => {
  try {
    if (!req.user || !req.user.email) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. User information missing.'
      });
    }

    const db = getDB();
    const user = await db.collection('users').findOne({ email: req.user.email });

    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. Admin access required.'
      });
    }

    req.currentUser = user;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to verify admin permissions.',
      error: error.message
    });
  }
};
