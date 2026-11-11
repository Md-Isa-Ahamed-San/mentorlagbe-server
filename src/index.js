import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB, closeDB, ensureDB } from './config/db.js';
import { stripeWebhookHandler } from './routes/stripe.routes.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import tuitionRoutes from './routes/tuition.routes.js';
import applicationRoutes from './routes/application.routes.js';
import adminRoutes from './routes/admin.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import statsRoutes from './routes/stats.routes.js';
import { seedDatabase } from './seed.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS — supports multiple origins or wildcard for easy preview deployments
const clientUrl = process.env.CLIENT_URL;
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (!clientUrl || clientUrl === '*' || origin === clientUrl) {
        return callback(null, true);
      }
      // Allow Vercel preview URLs automatically
      if (origin.endsWith('.vercel.app')) {
        return callback(null, true);
      }
      // Default to allowed for development
      return callback(null, true);
    },
    credentials: true,
  })
);

// 1. Stripe Webhook route - MUST use raw body before global express.json()
app.post(
  '/api/stripe/webhook',
  express.raw({ type: 'application/json' }),
  stripeWebhookHandler
);

// 2. Global JSON body parser for all other endpoints
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. Ensure database is connected before any API route runs
// In long-running Node this is a no-op after startup;
// In serverless (Vercel) this guarantees connection across lambdas without cold-crash.
app.use('/api', ensureDB);

// Health Check & Root
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'MentorLagbe API server is healthy',
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.status(200).json({
    name: 'MentorLagbe API',
    version: '1.0.0',
    description: 'Production-ready REST API for MentorLagbe Tuition Platform'
  });
});

// 4. API Routers
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tuitions', tuitionRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/stats', statsRoutes);

// 5. 404 Handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// 6. Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('[Global Error Handler]:', err.stack || err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Start Server and Database Connection for standalone/dev environments
// (Skipped automatically when running inside Vercel serverless functions)
if (!process.env.VERCEL) {
  const startServer = async () => {
    try {
      const db = await connectDB();

      // Check if tuitions collection is empty; if so, automatically seed
      const tuitionsCol = db.collection('tuitions');
      const tuitionCount = await tuitionsCol.countDocuments();
      if (tuitionCount === 0) {
        console.log('[Server] Tuitions collection is empty. Auto-running seeder...');
        await seedDatabase();
      } else {
        console.log(`[Server] Database ready with ${tuitionCount} tuitions.`);
      }

      const server = app.listen(PORT, () => {
        console.log(`🚀 MentorLagbe API server is running on http://localhost:${PORT}`);
        console.log(`🔗 Allowed CORS origin: ${clientUrl || 'All / Vercel Previews'}`);
      });

      // Graceful Shutdown
      const handleShutdown = async (signal) => {
        console.log(`\n[Server] Received ${signal}. Gracefully closing HTTP server and MongoDB connection...`);
        server.close(async () => {
          await closeDB();
          process.exit(0);
        });
      };

      process.on('SIGINT', () => handleShutdown('SIGINT'));
      process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  };

  startServer();
}

export default app;
