// MongoDB Connection Test API
import connectDB from './config/database';
import mongoose from 'mongoose';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    console.log('Testing MongoDB connection...');
    
    // Check if MONGODB_URI is defined
    if (!process.env.MONGODB_URI) {
      return res.status(500).json({
        success: false,
        message: 'MongoDB URI is not configured',
        error: 'MONGODB_URI environment variable is missing'
      });
    }
    
    // Log the MongoDB URI (with password masked)
    const mongoUri = process.env.MONGODB_URI;
    const maskedUri = mongoUri.replace(/:([^:@]+)@/, ':****@');
    console.log('MongoDB URI (masked):', maskedUri);
    
    // Test connection
    console.log('Connecting to MongoDB...');
    await connectDB();
    
    // Get connection status
    const connectionState = mongoose.connection.readyState;
    const connectionStateText = {
      0: 'Disconnected',
      1: 'Connected',
      2: 'Connecting',
      3: 'Disconnecting',
      99: 'Uninitialized'
    }[connectionState] || 'Unknown';
    
    console.log(`MongoDB connection state: ${connectionStateText} (${connectionState})`);
    
    if (connectionState === 1) {
      // Connection successful
      const dbName = mongoose.connection.db.databaseName;
      const collections = await mongoose.connection.db.listCollections().toArray();
      const collectionNames = collections.map(c => c.name);
      
      return res.status(200).json({
        success: true,
        message: 'MongoDB connection test successful',
        connection: {
          state: connectionStateText,
          stateCode: connectionState,
          host: mongoose.connection.host,
          database: dbName,
          collections: collectionNames,
          hasUserCollection: collectionNames.includes('users')
        },
        timestamp: new Date().toISOString()
      });
    } else {
      // Connection not ready
      return res.status(500).json({
        success: false,
        message: 'MongoDB connection not established',
        connection: {
          state: connectionStateText,
          stateCode: connectionState
        },
        timestamp: new Date().toISOString()
      });
    }
    
  } catch (error) {
    console.error('MongoDB test error:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      codeName: error.codeName
    });
    
    // Provide specific error information
    let errorType = 'unknown';
    let errorMessage = 'Unknown error occurred';
    
    if (error.name === 'MongoServerSelectionError') {
      errorType = 'connection';
      errorMessage = 'Could not connect to MongoDB server';
    } else if (error.name === 'MongoParseError') {
      errorType = 'uri_format';
      errorMessage = 'Invalid MongoDB connection string format';
    } else if (error.name === 'MongoNetworkError') {
      errorType = 'network';
      errorMessage = 'Network connectivity issue';
    } else if (error.name === 'MongoError' && error.code === 18) {
      errorType = 'authentication';
      errorMessage = 'Invalid MongoDB credentials';
    } else if (error.name === 'MongoError' && error.code === 13) {
      errorType = 'authorization';
      errorMessage = 'Insufficient MongoDB permissions';
    }
    
    res.status(500).json({
      success: false,
      message: 'MongoDB connection test failed',
      error: errorMessage,
      errorType: errorType,
      errorDetails: error.message,
      timestamp: new Date().toISOString()
    });
  }
}