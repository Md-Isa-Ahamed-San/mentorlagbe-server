import jwt from 'jsonwebtoken';
import { getDB } from '../config/db.js';

/**
 * Sync / upsert user on sign-up or login
 * POST /api/auth/sync
 */
export const syncUser = async (req, res) => {
  try {
    const { name, email, image, role } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required to sync user profile.'
      });
    }

    const db = getDB();
    const usersCol = db.collection('users');

    const existingUser = await usersCol.findOne({ email });

    if (existingUser) {
      // Update profile fields without overwriting established role or plan unless specified
      const updateDoc = {
        $set: {
          name: name || existingUser.name,
          image: image || existingUser.image,
          updatedAt: new Date()
        }
      };

      if (!existingUser.role && role) {
        updateDoc.$set.role = role;
      }

      await usersCol.updateOne({ email }, updateDoc);
      const updatedUser = await usersCol.findOne({ email });

      return res.status(200).json({
        success: true,
        message: 'User synchronized successfully.',
        user: updatedUser
      });
    }

    // New user creation
    const newUser = {
      name: name || '',
      email,
      image: image || '',
      role: role || 'student',
      plan: 'free',
      phone: '',
      bio: '',
      savedTuitions: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const insertResult = await usersCol.insertOne(newUser);
    const createdUser = await usersCol.findOne({ _id: insertResult.insertedId });

    return res.status(201).json({
      success: true,
      message: 'User created successfully.',
      user: createdUser
    });
  } catch (error) {
    console.error('Error in syncUser:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to sync user.',
      error: error.message
    });
  }
};

/**
 * Issue a JWT for authenticated user
 * POST /api/auth/jwt
 */
export const generateJWT = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required to generate a token.'
      });
    }

    const db = getDB();
    const usersCol = db.collection('users');
    const user = await usersCol.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found in system.'
      });
    }

    const secret = process.env.JWT_SECRET || 'mentorlagbe_super_secret_jwt_key_2024';
    const payload = {
      email: user.email,
      role: user.role
    };

    const token = jwt.sign(payload, secret, { expiresIn: '7d' });

    return res.status(200).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        plan: user.plan,
        image: user.image
      }
    });
  } catch (error) {
    console.error('Error in generateJWT:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate JWT token.',
      error: error.message
    });
  }
};
