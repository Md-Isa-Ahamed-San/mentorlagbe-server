import { getDB } from '../config/db.js';

/**
 * Get statistics for student dashboard
 * GET /api/stats/student [verifyToken, verifyStudent]
 */
export const getStudentStats = async (req, res) => {
  try {
    const db = getDB();
    const applicationsCol = db.collection('applications');
    const usersCol = db.collection('users');

    const [user, applications] = await Promise.all([
      usersCol.findOne({ email: req.user.email }),
      applicationsCol.find({ studentEmail: req.user.email }).toArray()
    ]);

    const totalApplied = applications.length;
    const accepted = applications.filter((app) => app.status === 'accepted').length;
    const pending = applications.filter((app) => app.status === 'pending').length;
    const rejected = applications.filter((app) => app.status === 'rejected').length;

    return res.status(200).json({
      totalApplied,
      accepted,
      pending,
      rejected,
      plan: user?.plan || 'free'
    });
  } catch (error) {
    console.error('Error in getStudentStats:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve student dashboard statistics.',
      error: error.message
    });
  }
};

/**
 * Get statistics for tutor dashboard
 * GET /api/stats/tutor [verifyToken, verifyTutor]
 */
export const getTutorStats = async (req, res) => {
  try {
    const db = getDB();
    const tuitionsCol = db.collection('tuitions');
    const applicationsCol = db.collection('applications');
    const usersCol = db.collection('users');

    const [user, tuitions, applications] = await Promise.all([
      usersCol.findOne({ email: req.user.email }),
      tuitionsCol.find({ tutorEmail: req.user.email }).toArray(),
      applicationsCol.find({ tutorEmail: req.user.email }).toArray()
    ]);

    const totalTuitions = tuitions.length;
    const activeTuitions = tuitions.filter((t) => t.isActive).length;
    const totalApplicants = applications.length;

    const applicantsPerTuition = tuitions.map((t) => {
      const tId = t._id.toString();
      const count = applications.filter((a) => a.tuitionId === tId).length;
      return {
        tuitionId: tId,
        title: t.title,
        subject: t.subject,
        applicantsCount: count
      };
    });

    return res.status(200).json({
      totalTuitions,
      activeTuitions,
      totalApplicants,
      plan: user?.plan || 'free',
      applicantsPerTuition
    });
  } catch (error) {
    console.error('Error in getTutorStats:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve tutor dashboard statistics.',
      error: error.message
    });
  }
};
