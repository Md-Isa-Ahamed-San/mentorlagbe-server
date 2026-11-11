import { ObjectId } from 'mongodb';
import { getDB } from '../config/db.js';

/**
 * Get profile of current logged-in user
 * GET /api/users/me
 */
export const getCurrentUser = async (req, res) => {
  try {
    const db = getDB();
    const usersCol = db.collection('users');

    const user = await usersCol.findOne({ email: req.user.email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.'
      });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve user profile.',
      error: error.message
    });
  }
};

/**
 * Update profile of logged-in user
 * PATCH /api/users/profile
 */
export const updateProfile = async (req, res) => {
  try {
    const { name, phone, bio, image } = req.body;
    const db = getDB();
    const usersCol = db.collection('users');

    const updateFields = { updatedAt: new Date() };
    if (name !== undefined) updateFields.name = name;
    if (phone !== undefined) updateFields.phone = phone;
    if (bio !== undefined) updateFields.bio = bio;
    if (image !== undefined) updateFields.image = image;

    const result = await usersCol.updateOne(
      { email: req.user.email },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    const updatedUser = await usersCol.findOne({ email: req.user.email });
    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error in updateProfile:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update user profile.',
      error: error.message
    });
  }
};

/**
 * Toggle tuition bookmark/save for student
 * PATCH /api/users/bookmarks
 */
export const toggleBookmark = async (req, res) => {
  try {
    const { tuitionId } = req.body;

    if (!tuitionId) {
      return res.status(400).json({
        success: false,
        message: 'tuitionId is required to toggle bookmark.'
      });
    }

    const db = getDB();
    const usersCol = db.collection('users');

    const user = await usersCol.findOne({ email: req.user.email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    let savedTuitions = user.savedTuitions || [];
    const tIdStr = tuitionId.toString();

    const exists = savedTuitions.some(id => id.toString() === tIdStr);
    if (exists) {
      savedTuitions = savedTuitions.filter(id => id.toString() !== tIdStr);
    } else {
      savedTuitions.push(tIdStr);
    }

    await usersCol.updateOne(
      { email: req.user.email },
      { $set: { savedTuitions, updatedAt: new Date() } }
    );

    return res.status(200).json({
      success: true,
      message: exists ? 'Tuition removed from bookmarks.' : 'Tuition bookmarked successfully.',
      savedTuitions
    });
  } catch (error) {
    console.error('Error in toggleBookmark:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to toggle bookmark.',
      error: error.message
    });
  }
};

/**
 * Get full tuition records saved by student
 * GET /api/users/saved-tuitions
 */
export const getSavedTuitions = async (req, res) => {
  try {
    const db = getDB();
    const usersCol = db.collection('users');
    const tuitionsCol = db.collection('tuitions');

    const user = await usersCol.findOne({ email: req.user.email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    const savedTuitionIds = user.savedTuitions || [];
    if (savedTuitionIds.length === 0) {
      return res.status(200).json([]);
    }

    const validObjectIds = savedTuitionIds
      .filter(id => ObjectId.isValid(id))
      .map(id => new ObjectId(id));

    const tuitions = await tuitionsCol
      .find({ _id: { $in: validObjectIds } })
      .toArray();

    return res.status(200).json(tuitions);
  } catch (error) {
    console.error('Error in getSavedTuitions:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch saved tuitions.',
      error: error.message
    });
  }
};
