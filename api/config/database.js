import mongoose from 'mongoose';

// Cache the database connection for serverless environment
let cachedDb = null;

const connectDB = async () => {
  // If we have a cached connection and it's connected, use it
  if (cachedDb && mongoose.connection.readyState === 1) {
    console.log('Using cached database connection');
    return cachedDb;
  }

  try {
    // Check if MONGODB_URI is defined
    if (!process.env.MONGODB_URI) {
      console.error('MONGODB_URI environment variable is not defined');
      throw new Error('MONGODB_URI environment variable is not defined');
    }

    console.log('Connecting to MongoDB...');
    
    // Important: Remove deprecated options and use the new connection syntax
    // that works well with Vercel serverless functions
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      });
    }
    
    // Cache the mongoose instance
    cachedDb = mongoose;
    
    console.log(`MongoDB Connected: ${mongoose.connection.host}`);
    return mongoose;
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
};

export default connectDB;