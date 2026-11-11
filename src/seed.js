import 'dotenv/config';
import { connectDB, getDB, closeDB } from './config/db.js';

export const seedDatabase = async () => {
  try {
    const db = getDB();
    const usersCol = db.collection('users');
    const tuitionsCol = db.collection('tuitions');
    const applicationsCol = db.collection('applications');
    const paymentsCol = db.collection('payments');

    console.log('[Seeder] Starting database seed process...');

    // 1. Seed 4 initial test users (Upsert by email)
    const testUsers = [
      {
        name: 'Admin User',
        email: 'admin@mentorlagbe.com',
        image: 'https://ui-avatars.com/api/?name=Admin+User&background=0D9488&color=fff',
        role: 'admin',
        plan: 'pro',
        phone: '+880-1700-000001',
        bio: 'Platform administrator overseeing mentors and course quality.',
        savedTuitions: [],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Karim Rahman',
        email: 'tutor@mentorlagbe.com',
        image: 'https://ui-avatars.com/api/?name=Karim+Rahman&background=0D9488&color=fff',
        role: 'tutor',
        plan: 'pro',
        phone: '+880-1700-000002',
        bio: 'Experienced educator with 10+ years of teaching Mathematics and Physics. MSc in Applied Mathematics from DU.',
        savedTuitions: [],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Rafiq Hasan',
        email: 'rafiq.tutor@mentorlagbe.com',
        image: 'https://ui-avatars.com/api/?name=Rafiq+Hasan&background=0D9488&color=fff',
        role: 'tutor',
        plan: 'free',
        phone: '+880-1700-000003',
        bio: 'Computer Science graduate passionate about teaching programming.',
        savedTuitions: [],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Nusrat Jahan',
        email: 'student@mentorlagbe.com',
        image: 'https://ui-avatars.com/api/?name=Nusrat+Jahan&background=0D9488&color=fff',
        role: 'student',
        plan: 'free',
        phone: '+880-1700-000004',
        bio: 'HSC student preparing for university admission.',
        savedTuitions: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    for (const user of testUsers) {
      await usersCol.updateOne(
        { email: user.email },
        { $set: user },
        { upsert: true }
      );
    }
    console.log('[Seeder] Test users verified/upserted.');

    // 2. Check if tuitions collection is already seeded
    const tuitionCount = await tuitionsCol.countDocuments();
    if (tuitionCount > 0) {
      console.log(`[Seeder] Tuitions collection already contains ${tuitionCount} documents. Skipping tuition and application seeding.`);
      return;
    }

    // 3. 14 Sample Tuitions (12 approved + 2 pending)
    const sampleReviews = [
      {
        studentName: 'Nusrat Jahan',
        studentEmail: 'student@mentorlagbe.com',
        rating: 5,
        comment: 'Excellent teaching methodology! Made complex concepts very easy to understand.',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      },
      {
        studentName: 'Anika Rahman',
        studentEmail: 'anika@student.com',
        rating: 4,
        comment: 'Very helpful and patient tutor. Highly recommended!',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      }
    ];

    const tuitionsData = [
      {
        title: 'Mastering Advanced Mathematics for HSC & University Admission',
        subject: 'Mathematics',
        classLevel: 'HSC',
        mode: 'Online',
        monthlyFee: 4500,
        daysPerWeek: 4,
        location: 'Online',
        schedule: 'Mon, Wed, Fri, Sun - 7:00 PM',
        description: 'Comprehensive curriculum covering calculus, coordinate geometry, trigonometry, and past university admission question banks.',
        image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800',
        tutorName: 'Karim Rahman',
        tutorEmail: 'tutor@mentorlagbe.com',
        tutorPhone: '+880-1700-000002',
        approvalStatus: 'approved',
        isActive: true,
        reviews: sampleReviews,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      },
      {
        title: 'Complete SSC Physics: Concept Clearing & Numerical Solving',
        subject: 'Physics',
        classLevel: 'SSC',
        mode: 'Offline',
        monthlyFee: 3500,
        daysPerWeek: 3,
        location: 'Dhanmondi, Dhaka',
        schedule: 'Sat, Mon, Wed - 5:00 PM',
        description: 'Hands-on problem solving, interactive demonstrations, and regular mock tests tailored for top grades in board exams.',
        image: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=800',
        tutorName: 'Karim Rahman',
        tutorEmail: 'tutor@mentorlagbe.com',
        tutorPhone: '+880-1700-000002',
        approvalStatus: 'approved',
        isActive: true,
        reviews: [sampleReviews[1]],
        createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      },
      {
        title: 'Modern Web Development with Next.js, React & Node.js',
        subject: 'Programming (Next.js)',
        classLevel: 'Professional',
        mode: 'Online',
        monthlyFee: 6500,
        daysPerWeek: 3,
        location: 'Online',
        schedule: 'Tue, Thu, Sat - 8:30 PM',
        description: 'Build production-ready web apps from scratch with Server Components, API routes, authentication, and database integration.',
        image: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=800',
        tutorName: 'Karim Rahman',
        tutorEmail: 'tutor@mentorlagbe.com',
        tutorPhone: '+880-1700-000002',
        approvalStatus: 'approved',
        isActive: true,
        reviews: [sampleReviews[0]],
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      },
      {
        title: 'Python Mastery: From Fundamentals to Data Structures & Algorithms',
        subject: 'Programming (Python)',
        classLevel: 'University',
        mode: 'Online',
        monthlyFee: 4000,
        daysPerWeek: 3,
        location: 'Online',
        schedule: 'Sun, Tue, Thu - 7:30 PM',
        description: 'Ideal for undergraduate CS students and beginners aiming for competitive programming and interview readiness.',
        image: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800',
        tutorName: 'Karim Rahman',
        tutorEmail: 'tutor@mentorlagbe.com',
        tutorPhone: '+880-1700-000002',
        approvalStatus: 'approved',
        isActive: true,
        reviews: [],
        createdAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      },
      {
        title: 'IELTS Academic & General Training: Band 7.5+ Strategy',
        subject: 'IELTS Preparation',
        classLevel: 'Professional',
        mode: 'Online',
        monthlyFee: 5000,
        daysPerWeek: 4,
        location: 'Online',
        schedule: 'Mon, Tue, Wed, Thu - 9:00 PM',
        description: 'Intensive practice for Speaking, Writing Task 1 & 2, Reading speed techniques, and Listening accuracy with live mock evaluations.',
        image: 'https://images.unsplash.com/photo-1543109740-4bdb38fda756?w=800',
        tutorName: 'Karim Rahman',
        tutorEmail: 'tutor@mentorlagbe.com',
        tutorPhone: '+880-1700-000002',
        approvalStatus: 'approved',
        isActive: true,
        reviews: [],
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      },
      {
        title: 'A-Level Chemistry: Physical, Inorganic & Organic Deep Dive',
        subject: 'Chemistry',
        classLevel: 'A-Level',
        mode: 'Offline',
        monthlyFee: 7000,
        daysPerWeek: 4,
        location: 'Gulshan, Dhaka',
        schedule: 'Sat, Sun, Tue, Thu - 4:00 PM',
        description: 'Rigorous exam-focused guidance for Cambridge & Edexcel A-Level Chemistry candidates with past paper solving.',
        image: 'https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?w=800',
        tutorName: 'Karim Rahman',
        tutorEmail: 'tutor@mentorlagbe.com',
        tutorPhone: '+880-1700-000002',
        approvalStatus: 'approved',
        isActive: true,
        reviews: [],
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      },
      {
        title: 'High School Biology & Medical Admission Foundation',
        subject: 'Biology',
        classLevel: 'HSC',
        mode: 'Offline',
        monthlyFee: 3200,
        daysPerWeek: 3,
        location: 'Uttara, Dhaka',
        schedule: 'Mon, Wed, Fri - 3:30 PM',
        description: 'In-depth coverage of Botany and Zoology with diagram labeling, mnemonics, and weekly chapter tests.',
        image: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=800',
        tutorName: 'Karim Rahman',
        tutorEmail: 'tutor@mentorlagbe.com',
        tutorPhone: '+880-1700-000002',
        approvalStatus: 'approved',
        isActive: true,
        reviews: [],
        createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      },
      {
        title: 'O-Level English Literature & Essay Composition',
        subject: 'English Literature',
        classLevel: 'O-Level',
        mode: 'Online',
        monthlyFee: 2800,
        daysPerWeek: 3,
        location: 'Online',
        schedule: 'Sat, Mon, Wed - 6:00 PM',
        description: 'Detailed analysis of prescribed prose, poetry, and Shakespeare drama along with essay structure refinement.',
        image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800',
        tutorName: 'Karim Rahman',
        tutorEmail: 'tutor@mentorlagbe.com',
        tutorPhone: '+880-1700-000002',
        approvalStatus: 'approved',
        isActive: true,
        reviews: [],
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      },
      {
        title: 'University Financial Accounting & Managerial Finance',
        subject: 'Accounting',
        classLevel: 'University',
        mode: 'Offline',
        monthlyFee: 4800,
        daysPerWeek: 3,
        location: 'Mirpur, Dhaka',
        schedule: 'Tue, Thu, Sat - 6:30 PM',
        description: 'Balance sheets, cash flows, ledger reconciliation, and cost accounting simplified for BBA / BBS students.',
        image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800',
        tutorName: 'Karim Rahman',
        tutorEmail: 'tutor@mentorlagbe.com',
        tutorPhone: '+880-1700-000002',
        approvalStatus: 'approved',
        isActive: true,
        reviews: [],
        createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      },
      {
        title: 'University Advanced Calculus, Differential Equations & Matrices',
        subject: 'Advanced Mathematics',
        classLevel: 'University',
        mode: 'Online',
        monthlyFee: 5500,
        daysPerWeek: 4,
        location: 'Online',
        schedule: 'Mon, Wed, Fri, Sun - 8:00 PM',
        description: 'Multivariable calculus, linear algebra, vector spaces, and Fourier series designed for engineering and physics majors.',
        image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800',
        tutorName: 'Karim Rahman',
        tutorEmail: 'tutor@mentorlagbe.com',
        tutorPhone: '+880-1700-000002',
        approvalStatus: 'approved',
        isActive: true,
        reviews: [],
        createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      },
      {
        title: 'Organic Chemistry: Mechanism Drills & Synthesis Strategies',
        subject: 'Organic Chemistry',
        classLevel: 'HSC',
        mode: 'Offline',
        monthlyFee: 3800,
        daysPerWeek: 3,
        location: 'Dhanmondi, Dhaka',
        schedule: 'Sun, Tue, Thu - 4:00 PM',
        description: 'Understand reaction intermediates, IUPAC nomenclature, electrophilic addition, and aromatic substitution with ease.',
        image: 'https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?w=800',
        tutorName: 'Karim Rahman',
        tutorEmail: 'tutor@mentorlagbe.com',
        tutorPhone: '+880-1700-000002',
        approvalStatus: 'approved',
        isActive: true,
        reviews: [],
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      },
      {
        title: 'Full-Stack JavaScript & MERN Stack Intensive Mentorship',
        subject: 'Web Development',
        classLevel: 'Professional',
        mode: 'Online',
        monthlyFee: 7500,
        daysPerWeek: 5,
        location: 'Online',
        schedule: 'Mon to Fri - 8:00 PM',
        description: 'Master MongoDB, Express, React, and Node.js. Build real-time apps, payment processing, and deployment pipelines.',
        image: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800',
        tutorName: 'Karim Rahman',
        tutorEmail: 'tutor@mentorlagbe.com',
        tutorPhone: '+880-1700-000002',
        approvalStatus: 'approved',
        isActive: true,
        reviews: [],
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      },
      // 2 Pending Tuitions from 'rafiq.tutor@mentorlagbe.com'
      {
        title: 'Practical Data Science & Machine Learning with Python',
        subject: 'Data Science',
        classLevel: 'University',
        mode: 'Online',
        monthlyFee: 6000,
        daysPerWeek: 4,
        location: 'Online',
        schedule: 'Mon, Wed, Fri, Sun - 7:00 PM',
        description: 'NumPy, Pandas, Scikit-Learn, data visualization, exploratory analysis, and supervised machine learning model building.',
        image: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800',
        tutorName: 'Rafiq Hasan',
        tutorEmail: 'rafiq.tutor@mentorlagbe.com',
        tutorPhone: '+880-1700-000003',
        approvalStatus: 'pending',
        isActive: true,
        reviews: [],
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      },
      {
        title: 'Creative Writing, Storytelling & Critical Thinking for Teens',
        subject: 'Creative Writing',
        classLevel: 'SSC',
        mode: 'Offline',
        monthlyFee: 2200,
        daysPerWeek: 3,
        location: 'Mirpur, Dhaka',
        schedule: 'Sat, Mon, Wed - 4:30 PM',
        description: 'Spark imagination, structure captivating narratives, develop rich characters, and write persuasive essays.',
        image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800',
        tutorName: 'Rafiq Hasan',
        tutorEmail: 'rafiq.tutor@mentorlagbe.com',
        tutorPhone: '+880-1700-000003',
        approvalStatus: 'pending',
        isActive: true,
        reviews: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    const insertResult = await tuitionsCol.insertMany(tuitionsData);
    const insertedIds = Object.values(insertResult.insertedIds);
    console.log(`[Seeder] Seeded ${insertedIds.length} tuitions successfully.`);

    // Update student's bookmark list with a couple of tuition IDs
    if (insertedIds.length > 2) {
      await usersCol.updateOne(
        { email: 'student@mentorlagbe.com' },
        {
          $set: {
            savedTuitions: [insertedIds[0].toString(), insertedIds[3].toString()]
          }
        }
      );
    }

    // 4. Seed 6 Applications (3 from student@mentorlagbe.com, 3 from other students)
    const t0 = tuitionsData[0];
    const t1 = tuitionsData[1];
    const t2 = tuitionsData[2];
    const t3 = tuitionsData[3];
    const t4 = tuitionsData[4];

    const applicationsData = [
      {
        tuitionId: insertedIds[0].toString(),
        tuitionTitle: t0.title,
        subject: t0.subject,
        classLevel: t0.classLevel,
        monthlyFee: t0.monthlyFee,
        mode: t0.mode,
        tutorName: t0.tutorName,
        tutorEmail: t0.tutorEmail,
        studentName: 'Nusrat Jahan',
        studentEmail: 'student@mentorlagbe.com',
        studentPhone: '+880-1700-000004',
        message: 'I am preparing for upcoming HSC board exams and university admission. Need help with calculus and trigonometry.',
        status: 'accepted',
        appliedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      },
      {
        tuitionId: insertedIds[1].toString(),
        tuitionTitle: t1.title,
        subject: t1.subject,
        classLevel: t1.classLevel,
        monthlyFee: t1.monthlyFee,
        mode: t1.mode,
        tutorName: t1.tutorName,
        tutorEmail: t1.tutorEmail,
        studentName: 'Nusrat Jahan',
        studentEmail: 'student@mentorlagbe.com',
        studentPhone: '+880-1700-000004',
        message: 'Looking for a dedicated Physics tutor in Dhanmondi area.',
        status: 'pending',
        appliedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      },
      {
        tuitionId: insertedIds[2].toString(),
        tuitionTitle: t2.title,
        subject: t2.subject,
        classLevel: t2.classLevel,
        monthlyFee: t2.monthlyFee,
        mode: t2.mode,
        tutorName: t2.tutorName,
        tutorEmail: t2.tutorEmail,
        studentName: 'Nusrat Jahan',
        studentEmail: 'student@mentorlagbe.com',
        studentPhone: '+880-1700-000004',
        message: 'Interested in learning Next.js to build frontend applications.',
        status: 'rejected',
        appliedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      },
      {
        tuitionId: insertedIds[1].toString(),
        tuitionTitle: t1.title,
        subject: t1.subject,
        classLevel: t1.classLevel,
        monthlyFee: t1.monthlyFee,
        mode: t1.mode,
        tutorName: t1.tutorName,
        tutorEmail: t1.tutorEmail,
        studentName: 'Anika Rahman',
        studentEmail: 'anika@student.com',
        studentPhone: '+880-1700-000005',
        message: 'Need weekly revision on Newtonian mechanics and electricity.',
        status: 'accepted',
        appliedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      },
      {
        tuitionId: insertedIds[3].toString(),
        tuitionTitle: t3.title,
        subject: t3.subject,
        classLevel: t3.classLevel,
        monthlyFee: t3.monthlyFee,
        mode: t3.mode,
        tutorName: t3.tutorName,
        tutorEmail: t3.tutorEmail,
        studentName: 'Tanvir Hossain',
        studentEmail: 'tanvir@student.com',
        studentPhone: '+880-1700-000006',
        message: 'Interested in mastering Python programming for my university coursework.',
        status: 'pending',
        appliedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      },
      {
        tuitionId: insertedIds[4].toString(),
        tuitionTitle: t4.title,
        subject: t4.subject,
        classLevel: t4.classLevel,
        monthlyFee: t4.monthlyFee,
        mode: t4.mode,
        tutorName: t4.tutorName,
        tutorEmail: t4.tutorEmail,
        studentName: 'Sadia Islam',
        studentEmail: 'sadia@student.com',
        studentPhone: '+880-1700-000007',
        message: 'Planning to sit for IELTS exam next month, aiming for 7.5+ in writing and speaking.',
        status: 'accepted',
        appliedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      }
    ];

    await applicationsCol.insertMany(applicationsData);
    console.log('[Seeder] Seeded 6 applications successfully.');

    // 5. Seed 2 sample payment records
    const paymentsData = [
      {
        userEmail: 'tutor@mentorlagbe.com',
        userName: 'Karim Rahman',
        userRole: 'tutor',
        planName: 'Pro Tutor Plan',
        amount: 15,
        currency: 'usd',
        transactionId: 'txn_mock_001',
        stripeSessionId: 'cs_mock_001',
        paymentStatus: 'paid',
        paidAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000)
      },
      {
        userEmail: 'admin@mentorlagbe.com',
        userName: 'Admin User',
        userRole: 'admin',
        planName: 'Pro Tutor Plan',
        amount: 15,
        currency: 'usd',
        transactionId: 'txn_mock_002',
        stripeSessionId: 'cs_mock_002',
        paymentStatus: 'paid',
        paidAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
      }
    ];

    await paymentsCol.insertMany(paymentsData);
    console.log('[Seeder] Seeded 2 payment records successfully.');

    console.log('✅ [Seeder] Database seeding completed successfully.');
  } catch (error) {
    console.error('[Seeder] Error during seeding:', error);
    throw error;
  }
};

// Allow running directly via "node src/seed.js"
if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('src/seed.js')) {
  (async () => {
    try {
      await connectDB();
      await seedDatabase();
      await closeDB();
      process.exit(0);
    } catch (err) {
      console.error('Seed script failed:', err);
      process.exit(1);
    }
  })();
}
