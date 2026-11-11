import { MongoClient } from 'mongodb';

let client = null;
let db = null;

/**
 * Connect to MongoDB using MongoClient.
 * Safe to call multiple times — returns the cached connection if already open.
 * Works in both long-running (Node/Nodemon) and serverless (Vercel) environments.
 * @returns {Promise<import('mongodb').Db>}
 */
export const connectDB = async () => {
  if (db) {
    return db;
  }

  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mentorlagbe';

  try {
    client = new MongoClient(uri, {
      // Tune timeouts for serverless cold-start scenarios
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });
    await client.connect();
    db = client.db();
    console.log(`[Database] Successfully connected to MongoDB: ${db.databaseName}`);
    return db;
  } catch (error) {
    console.error('[Database] MongoDB connection error:', error.message);
    throw error;
  }
};

/**
 * Returns the active MongoDB database instance (synchronous).
 * Throws if connectDB() has not been called yet.
 * In serverless mode the ensureDB middleware calls connectDB before every request,
 * so by the time any controller runs, db is always populated.
 * @returns {import('mongodb').Db}
 */
export const getDB = () => {
  if (!db) {
    throw new Error('Database not initialized. Call connectDB() first.');
  }
  return db;
};

/**
 * Express middleware: ensures MongoDB is connected before the request is handled.
 * Idempotent — the second call returns instantly from cache.
 * Use this in serverless environments where there is no persistent startup.
 */
export const ensureDB = async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('[ensureDB] Failed to connect to MongoDB:', err.message);
    res.status(503).json({ success: false, message: 'Database unavailable. Please try again.' });
  }
};

/**
 * Closes the MongoDB connection
 * @returns {Promise<void>}
 */
export const closeDB = async () => {
  if (client) {
    await client.close();
    db = null;
    client = null;
    console.log('[Database] MongoDB connection closed.');
  }
};
