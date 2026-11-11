import { ObjectId } from 'mongodb';
import { getDB } from '../config/db.js';

/**
 * Apply for a tuition
 * POST /api/applications [verifyToken, verifyStudent]
 */
export const createApplication = async (req, res) => {
  try {
    const { tuitionId, message, studentPhone, qualifications } = req.body;

    if (!tuitionId) {
      return res.status(400).json({
        success: false,
        message: 'tuitionId is required to submit an application.'
      });
    }

    if (!ObjectId.isValid(tuitionId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tuition ID format.'
      });
    }

    const db = getDB();
    const tuitionsCol = db.collection('tuitions');
    const applicationsCol = db.collection('applications');
    const usersCol = db.collection('users');

    const tuition = await tuitionsCol.findOne({ _id: new ObjectId(tuitionId) });
    if (!tuition) {
      return res.status(404).json({
        success: false,
        message: 'Tuition post not found.'
      });
    }

    // Check for duplicate application by this student for this tuition
    const existing = await applicationsCol.findOne({
      tuitionId: tuitionId.toString(),
      studentEmail: req.user.email
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'You have already submitted an application for this tuition.'
      });
    }

    const studentUser = await usersCol.findOne({ email: req.user.email });

    const newApplication = {
      tuitionId: tuition._id.toString(),
      tuitionTitle: tuition.title,
      subject: tuition.subject,
      classLevel: tuition.classLevel,
      monthlyFee: tuition.monthlyFee,
      mode: tuition.mode,
      tutorName: tuition.tutorName,
      tutorEmail: tuition.tutorEmail,
      studentName: studentUser?.name || 'Student',
      studentEmail: req.user.email,
      studentPhone: studentPhone || studentUser?.phone || '',
      message: message || '',
      qualifications: qualifications || '',
      status: 'pending', // 'pending' | 'accepted' | 'rejected'
      appliedAt: new Date(),
      updatedAt: new Date()
    };

    const result = await applicationsCol.insertOne(newApplication);
    const createdApp = await applicationsCol.findOne({ _id: result.insertedId });

    return res.status(201).json({
      success: true,
      message: 'Application submitted successfully.',
      application: createdApp
    });
  } catch (error) {
    console.error('Error in createApplication:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit application.',
      error: error.message
    });
  }
};

/**
 * Get all applications submitted by the logged-in student
 * GET /api/applications/student [verifyToken, verifyStudent]
 */
export const getStudentApplications = async (req, res) => {
  try {
    const db = getDB();
    const applicationsCol = db.collection('applications');

    const applications = await applicationsCol
      .find({ studentEmail: req.user.email })
      .sort({ appliedAt: -1 })
      .toArray();

    return res.status(200).json(applications);
  } catch (error) {
    console.error('Error in getStudentApplications:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve student applications.',
      error: error.message
    });
  }
};

/**
 * Get all applications received by the logged-in tutor
 * GET /api/applications/tutor [verifyToken, verifyTutor]
 */
export const getTutorApplications = async (req, res) => {
  try {
    const db = getDB();
    const applicationsCol = db.collection('applications');

    const applications = await applicationsCol
      .find({ tutorEmail: req.user.email })
      .sort({ appliedAt: -1 })
      .toArray();

    return res.status(200).json(applications);
  } catch (error) {
    console.error('Error in getTutorApplications:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve tutor applications.',
      error: error.message
    });
  }
};

/**
 * Update application status (accepted or rejected) by tutor
 * PATCH /api/applications/:id/status [verifyToken, verifyTutor]
 */
export const updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be either 'accepted' or 'rejected'."
      });
    }

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid application ID format.'
      });
    }

    const db = getDB();
    const applicationsCol = db.collection('applications');

    const application = await applicationsCol.findOne({ _id: new ObjectId(id) });
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found.'
      });
    }

    if (application.tutorEmail !== req.user.email) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You can only update applications for your own tuitions.'
      });
    }

    await applicationsCol.updateOne(
      { _id: new ObjectId(id) },
      { $set: { status, updatedAt: new Date() } }
    );

    const updatedApp = await applicationsCol.findOne({ _id: new ObjectId(id) });

    return res.status(200).json({
      success: true,
      message: `Application ${status} successfully.`,
      application: updatedApp
    });
  } catch (error) {
    console.error('Error in updateApplicationStatus:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update application status.',
      error: error.message
    });
  }
};

/**
 * Cancel/delete a pending application by student
 * DELETE /api/applications/:id [verifyToken, verifyStudent]
 */
export const cancelApplication = async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid application ID format.'
      });
    }

    const db = getDB();
    const applicationsCol = db.collection('applications');

    const application = await applicationsCol.findOne({ _id: new ObjectId(id) });
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found.'
      });
    }

    if (application.studentEmail !== req.user.email) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You can only cancel your own applications.'
      });
    }

    if (application.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel an application that has already been accepted or rejected.'
      });
    }

    await applicationsCol.deleteOne({ _id: new ObjectId(id) });

    return res.status(200).json({
      success: true,
      message: 'Application cancelled successfully.'
    });
  } catch (error) {
    console.error('Error in cancelApplication:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to cancel application.',
      error: error.message
    });
  }
};
