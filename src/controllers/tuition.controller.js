import { ObjectId } from 'mongodb';
import { getDB } from '../config/db.js';

/**
 * Get tuitions with filtering, searching, sorting, and pagination
 * GET /api/tuitions (PUBLIC)
 */
export const getAllTuitions = async (req, res) => {
  try {
    const {
      search,
      subject,
      classLevel,
      mode,
      sort,
      page = 1,
      limit = 9
    } = req.query;

    const db = getDB();
    const tuitionsCol = db.collection('tuitions');

    // Base query: approved and active tuitions
    const query = {
      approvalStatus: 'approved',
      isActive: true
    };

    // Keyword search across title and subject
    if (search && search.trim() !== '') {
      query.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { subject: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    // Filter by subject
    if (subject && subject.toLowerCase() !== 'all') {
      query.subject = { $regex: `^${subject.trim()}$`, $options: 'i' };
    }

    // Filter by classLevel
    if (classLevel && classLevel.toLowerCase() !== 'all') {
      query.classLevel = { $regex: `^${classLevel.trim()}$`, $options: 'i' };
    }

    // Filter by mode
    if (mode && mode.toLowerCase() !== 'all') {
      query.mode = { $regex: `^${mode.trim()}$`, $options: 'i' };
    }

    // Sort options
    let sortOption = { createdAt: -1 };
    if (sort === 'asc') {
      sortOption = { monthlyFee: 1 };
    } else if (sort === 'desc') {
      sortOption = { monthlyFee: -1 };
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 9);
    const skip = (pageNum - 1) * limitNum;

    const total = await tuitionsCol.countDocuments(query);
    const tuitions = await tuitionsCol
      .find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum)
      .toArray();

    return res.status(200).json({
      success: true,
      tuitions,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1
    });
  } catch (error) {
    console.error('Error in getAllTuitions:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve tuitions.',
      error: error.message
    });
  }
};

/**
 * Get featured tuitions (6 latest approved & active)
 * GET /api/tuitions/featured (PUBLIC)
 */
export const getFeaturedTuitions = async (req, res) => {
  try {
    const db = getDB();
    const tuitionsCol = db.collection('tuitions');

    const featured = await tuitionsCol
      .find({ approvalStatus: 'approved', isActive: true })
      .sort({ createdAt: -1 })
      .limit(6)
      .toArray();

    return res.status(200).json(featured);
  } catch (error) {
    console.error('Error in getFeaturedTuitions:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve featured tuitions.',
      error: error.message
    });
  }
};

/**
 * Get my tuitions (for logged-in tutor)
 * GET /api/tuitions/my-tuitions [verifyToken, verifyTutor]
 */
export const getTutorMyTuitions = async (req, res) => {
  try {
    const db = getDB();
    const tuitionsCol = db.collection('tuitions');

    const tuitions = await tuitionsCol
      .find({ tutorEmail: req.user.email })
      .sort({ createdAt: -1 })
      .toArray();

    return res.status(200).json(tuitions);
  } catch (error) {
    console.error('Error in getTutorMyTuitions:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve tutor tuitions.',
      error: error.message
    });
  }
};

/**
 * Get single tuition by ID
 * GET /api/tuitions/:id (PUBLIC)
 */
export const getTuitionById = async (req, res) => {
  try {
    const { id } = req.params;

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

    return res.status(200).json(tuition);
  } catch (error) {
    console.error('Error in getTuitionById:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve tuition details.',
      error: error.message
    });
  }
};

/**
 * Create a new tuition post
 * POST /api/tuitions [verifyToken, verifyTutor]
 */
export const createTuition = async (req, res) => {
  try {
    const db = getDB();
    const usersCol = db.collection('users');
    const tuitionsCol = db.collection('tuitions');

    const tutorUser = await usersCol.findOne({ email: req.user.email });
    if (!tutorUser) {
      return res.status(404).json({
        success: false,
        message: 'Tutor account not found.'
      });
    }

    // Free plan constraint: max 2 tuitions
    const tutorPlan = tutorUser.plan || 'free';
    if (tutorPlan === 'free') {
      const existingCount = await tuitionsCol.countDocuments({ tutorEmail: req.user.email });
      if (existingCount >= 2) {
        return res.status(403).json({
          success: false,
          message: 'Free plan tutors can only post 2 tuitions. Upgrade to Pro for unlimited posts.'
        });
      }
    }

    const {
      title,
      subject,
      classLevel,
      mode,
      monthlyFee,
      daysPerWeek,
      location,
      schedule,
      description,
      image,
      bannerImage
    } = req.body;

    if (!title || !subject || !classLevel || !monthlyFee) {
      return res.status(400).json({
        success: false,
        message: 'Title, subject, classLevel, and monthlyFee are required.'
      });
    }

    const newTuition = {
      title,
      subject,
      classLevel,
      mode: mode || 'Online',
      monthlyFee: Number(monthlyFee),
      daysPerWeek: Number(daysPerWeek) || 3,
      location: location || 'Online',
      schedule: schedule || 'Flexible',
      description: description || '',
      image: image || bannerImage || 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800',
      bannerImage: bannerImage || image || 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800',
      tutorName: tutorUser.name || 'Anonymous Tutor',
      tutorEmail: tutorUser.email,
      tutorPhone: tutorUser.phone || '',
      approvalStatus: 'pending',
      isActive: true,
      reviews: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await tuitionsCol.insertOne(newTuition);
    const createdTuition = await tuitionsCol.findOne({ _id: result.insertedId });

    return res.status(201).json({
      success: true,
      message: 'Tuition created successfully and is pending approval.',
      tuition: createdTuition
    });
  } catch (error) {
    console.error('Error in createTuition:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create tuition.',
      error: error.message
    });
  }
};

/**
 * Update an existing tuition post
 * PATCH /api/tuitions/:id [verifyToken, verifyTutor]
 */
export const updateTuition = async (req, res) => {
  try {
    const { id } = req.params;

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

    // Ownership check
    if (tuition.tutorEmail !== req.user.email) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You can only update your own tuitions.'
      });
    }

    const {
      title,
      subject,
      classLevel,
      mode,
      monthlyFee,
      daysPerWeek,
      location,
      schedule,
      description,
      image,
      bannerImage
    } = req.body;

    const updateFields = { updatedAt: new Date() };
    if (title !== undefined) updateFields.title = title;
    if (subject !== undefined) updateFields.subject = subject;
    if (classLevel !== undefined) updateFields.classLevel = classLevel;
    if (mode !== undefined) updateFields.mode = mode;
    if (monthlyFee !== undefined) updateFields.monthlyFee = Number(monthlyFee);
    if (daysPerWeek !== undefined) updateFields.daysPerWeek = Number(daysPerWeek);
    if (location !== undefined) updateFields.location = location;
    if (schedule !== undefined) updateFields.schedule = schedule;
    if (description !== undefined) updateFields.description = description;
    if (image !== undefined || bannerImage !== undefined) {
      const imgVal = image || bannerImage;
      updateFields.image = imgVal;
      updateFields.bannerImage = imgVal;
    }

    await tuitionsCol.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    );

    const updatedTuition = await tuitionsCol.findOne({ _id: new ObjectId(id) });

    return res.status(200).json({
      success: true,
      message: 'Tuition updated successfully.',
      tuition: updatedTuition
    });
  } catch (error) {
    console.error('Error in updateTuition:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update tuition.',
      error: error.message
    });
  }
};

/**
 * Delete a tuition post
 * DELETE /api/tuitions/:id [verifyToken, verifyTutor]
 */
export const deleteTuition = async (req, res) => {
  try {
    const { id } = req.params;

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

    if (tuition.tutorEmail !== req.user.email) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You can only delete your own tuitions.'
      });
    }

    await tuitionsCol.deleteOne({ _id: new ObjectId(id) });

    return res.status(200).json({
      success: true,
      message: 'Tuition post deleted successfully.'
    });
  } catch (error) {
    console.error('Error in deleteTuition:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete tuition.',
      error: error.message
    });
  }
};

/**
 * Toggle tuition isActive status
 * PATCH /api/tuitions/:id/toggle [verifyToken, verifyTutor]
 */
export const toggleTuitionStatus = async (req, res) => {
  try {
    const { id } = req.params;

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

    if (tuition.tutorEmail !== req.user.email) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You can only modify your own tuitions.'
      });
    }

    const newActiveState = !tuition.isActive;

    await tuitionsCol.updateOne(
      { _id: new ObjectId(id) },
      { $set: { isActive: newActiveState, updatedAt: new Date() } }
    );

    const updated = await tuitionsCol.findOne({ _id: new ObjectId(id) });

    return res.status(200).json({
      success: true,
      message: `Tuition status set to ${newActiveState ? 'active' : 'inactive'}.`,
      tuition: updated
    });
  } catch (error) {
    console.error('Error in toggleTuitionStatus:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to toggle tuition status.',
      error: error.message
    });
  }
};

/**
 * Add a review for a tuition
 * POST /api/tuitions/:id/reviews [verifyToken, verifyStudent]
 */
export const addReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tuition ID format.'
      });
    }

    if (!rating || Number(rating) < 1 || Number(rating) > 5) {
      return res.status(400).json({
        success: false,
        message: 'A valid rating between 1 and 5 is required.'
      });
    }

    const db = getDB();
    const tuitionsCol = db.collection('tuitions');
    const applicationsCol = db.collection('applications');
    const usersCol = db.collection('users');

    const tuition = await tuitionsCol.findOne({ _id: new ObjectId(id) });
    if (!tuition) {
      return res.status(404).json({
        success: false,
        message: 'Tuition post not found.'
      });
    }

    // Verify student has an accepted application for this tuition
    const acceptedApp = await applicationsCol.findOne({
      tuitionId: id,
      studentEmail: req.user.email,
      status: 'accepted'
    });

    if (!acceptedApp) {
      return res.status(403).json({
        success: false,
        message: 'You can only review tuitions for which your application has been accepted.'
      });
    }

    const studentUser = await usersCol.findOne({ email: req.user.email });
    const studentName = studentUser?.name || 'Student';

    const newReview = {
      studentName,
      studentEmail: req.user.email,
      rating: Number(rating),
      comment: comment || '',
      createdAt: new Date()
    };

    await tuitionsCol.updateOne(
      { _id: new ObjectId(id) },
      { $push: { reviews: newReview } }
    );

    const updatedTuition = await tuitionsCol.findOne({ _id: new ObjectId(id) });

    return res.status(201).json({
      success: true,
      message: 'Review added successfully.',
      reviews: updatedTuition.reviews
    });
  } catch (error) {
    console.error('Error in addReview:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to add review.',
      error: error.message
    });
  }
};
