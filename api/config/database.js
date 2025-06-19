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

    console.log('Connecting to MongoDB Atlas...');
    
    // Important: Use the new connection syntax with optimized options for MongoDB Atlas
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 10000, // Timeout after 10s
        connectTimeoutMS: 15000,         // Connection timeout
        socketTimeoutMS: 45000,          // Socket timeout
        maxPoolSize: 10,                 // Maintain up to 10 socket connections
        family: 4                        // Use IPv4, skip trying IPv6
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
    
    // Throw a more descriptive error
    if (error.name === 'MongoServerSelectionError') {
      throw new Error(`Could not connect to MongoDB Atlas: ${error.message}. Please check your connection string and network.`);
    } else {
      throw error;
    }
  }
};

export default connectDB;