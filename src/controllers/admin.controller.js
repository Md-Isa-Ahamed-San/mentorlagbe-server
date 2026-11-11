import { ObjectId } from 'mongodb';
import { getDB } from '../config/db.js';

/**
 * Get system-wide platform statistics
 * GET /api/admin/stats [verifyToken, verifyAdmin]
 */
export const getAdminStats = async (req, res) => {
  try {
    const db = getDB();
    const usersCol = db.collection('users');
    const tuitionsCol = db.collection('tuitions');
    const paymentsCol = db.collection('payments');

    const [
      totalUsers,
      totalTutors,
      totalStudents,
      pendingTuitions,
      approvedTuitions,
      rejectedTuitions,
      revenueResult
    ] = await Promise.all([
      usersCol.countDocuments(),
      usersCol.countDocuments({ role: 'tutor' }),
      usersCol.countDocuments({ role: 'student' }),
      tuitionsCol.countDocuments({ approvalStatus: 'pending' }),
      tuitionsCol.countDocuments({ approvalStatus: 'approved' }),
      tuitionsCol.countDocuments({ approvalStatus: 'rejected' }),
      paymentsCol
        .aggregate([
          { $match: { paymentStatus: 'paid' } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ])
        .toArray()
    ]);

    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

    return res.status(200).json({
      totalUsers,
      totalTutors,
      totalStudents,
      pendingTuitions,
      approvedTuitions,
      rejectedTuitions,
      totalRevenue
    });
  } catch (error) {
    console.error('Error in getAdminStats:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve administrative statistics.',
      error: error.message
    });
  }
};

/**
 * Get all users with optional search
 * GET /api/admin/users [verifyToken, verifyAdmin]
 */
export const getAdminUsers = async (req, res) => {
  try {
    const { search } = req.query;
    const db = getDB();
    const usersCol = db.collection('users');

    const query = {};
    if (search && search.trim() !== '') {
      query.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { email: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    const users = await usersCol.find(query).sort({ createdAt: -1 }).toArray();

    return res.status(200).json(users);
  } catch (error) {
    console.error('Error in getAdminUsers:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve users.',
      error: error.message
    });
  }
};

/**
 * Update user role
 * PATCH /api/admin/users/:id/role [verifyToken, verifyAdmin]
 */
export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['student', 'tutor', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role. Role must be 'student', 'tutor', or 'admin'."
      });
    }

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format.'
      });
    }

    const db = getDB();
    const usersCol = db.collection('users');

    const user = await usersCol.findOne({ _id: new ObjectId(id) });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    await usersCol.updateOne(
      { _id: new ObjectId(id) },
      { $set: { role, updatedAt: new Date() } }
    );

    const updatedUser = await usersCol.findOne({ _id: new ObjectId(id) });

    return res.status(200).json({
      success: true,
      message: `User role updated to ${role}.`,
      user: updatedUser
    });
  } catch (error) {
    console.error('Error in updateUserRole:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update user role.',
      error: error.message
    });
  }
};

/**
 * Get all tuitions for moderation with optional filtering
 * GET /api/admin/tuitions [verifyToken, verifyAdmin]
 */
export const getAdminTuitions = async (req, res) => {
  try {
    const { approvalStatus, search } = req.query;
    const db = getDB();
    const tuitionsCol = db.collection('tuitions');

    const query = {};
    if (approvalStatus && approvalStatus.toLowerCase() !== 'all') {
      query.approvalStatus = approvalStatus;
    }

    if (search && search.trim() !== '') {
      query.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { subject: { $regex: search.trim(), $options: 'i' } },
        { tutorEmail: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    const tuitions = await tuitionsCol.find(query).sort({ createdAt: -1 }).toArray();

    return res.status(200).json(tuitions);
  } catch (error) {
    console.error('Error in getAdminTuitions:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve tuitions for administration.',
      error: error.message
    });
  }
};

/**
 * Moderate a tuition post (approve or reject)
 * PATCH /api/admin/tuitions/:id/moderate [verifyToken, verifyAdmin]
 */
export const moderateTuition = async (req, res) => {
  try {
    const { id } = req.params;
    const { approvalStatus } = req.body;

    if (!['approved', 'rejected', 'pending'].includes(approvalStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid approvalStatus. Must be 'approved', 'rejected', or 'pending'."
      });
    }

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tuition ID format.'
      });
    }

    const db = getDB();
    const tuitionsCol = db.collection('tuitions');

    const tuition = await tuitionsCol.findOne({ _id: new ObjectId(id) });
    if (!tuition) {
      return res.status(404).json({
        success: false,
        message: 'Tuition post not found.'
      });
    }

    await tuitionsCol.updateOne(
      { _id: new ObjectId(id) },
      { $set: { approvalStatus, updatedAt: new Date() } }
    );

    const updatedTuition = await tuitionsCol.findOne({ _id: new ObjectId(id) });

    return res.status(200).json({
      success: true,
      message: `Tuition ${approvalStatus} successfully.`,
      tuition: updatedTuition
    });
  } catch (error) {
    console.error('Error in moderateTuition:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to moderate tuition.',
      error: error.message
    });
  }
};

/**
 * Get all payment / transaction records
 * GET /api/admin/transactions [verifyToken, verifyAdmin]
 */
export const getAdminTransactions = async (req, res) => {
  try {
    const db = getDB();
    const paymentsCol = db.collection('payments');

    const transactions = await paymentsCol.find({}).sort({ paidAt: -1 }).toArray();

    return res.status(200).json(transactions);
  } catch (error) {
    console.error('Error in getAdminTransactions:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve transactions.',
      error: error.message
    });
  }
};
