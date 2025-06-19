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

    // Log the MongoDB URI (with password masked)
    const mongoUri = process.env.MONGODB_URI;
    const maskedUri = mongoUri.replace(/:([^:@]+)@/, ':****@');
    console.log('MongoDB URI (masked):', maskedUri);
    console.log('MongoDB URI first 20 chars:', mongoUri.substring(0, 20) + '...');

    console.log('Connecting to MongoDB Atlas...');
    
    // Important: Use the new connection syntax with optimized options for MongoDB Atlas
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 15000, // Increased timeout to 15s
        connectTimeoutMS: 30000,         // Increased connection timeout
        socketTimeoutMS: 60000,          // Increased socket timeout
        maxPoolSize: 10,                 // Maintain up to 10 socket connections
        family: 4,                       // Use IPv4, skip trying IPv6
        retryWrites: true,
        w: 'majority'
      });
    }
    
    // Cache the mongoose instance
    cachedDb = mongoose;
    
    console.log(`MongoDB Connected: ${mongoose.connection.host}`);
    return mongoose;
  } catch (error) {
    console.error('Database connection error:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      codeName: error.codeName
    });
    
    // More detailed error handling
    if (error.name === 'MongoServerSelectionError') {
      console.error('MongoDB Server Selection Error - Could not connect to any MongoDB server');
      console.error('This usually indicates network issues or incorrect connection string');
    } else if (error.name === 'MongoParseError') {
      console.error('MongoDB Parse Error - Invalid connection string format');
    } else if (error.name === 'MongoNetworkError') {
      console.error('MongoDB Network Error - Network connectivity issue');
    } else if (error.name === 'MongoError' && error.code === 18) {
      console.error('MongoDB Authentication Error - Invalid credentials');
    } else if (error.name === 'MongoError' && error.code === 13) {
      console.error('MongoDB Authorization Error - Insufficient permissions');
    }
    
    // Return a more graceful error that won't crash the application
    throw new Error(`MongoDB connection failed: ${error.message}. Please check your connection string, credentials, and network.`);
  }
};

export default connectDB;