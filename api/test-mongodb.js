// Simple MongoDB connection test
import connectDB from './config/database';

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
    
    // Log the MongoDB URI (with password masked)
    const mongoUri = process.env.MONGODB_URI || '';
    const maskedUri = mongoUri.replace(/:([^:@]+)@/, ':****@');
    console.log('MongoDB URI (masked):', maskedUri);
    
    // Connect to MongoDB
    const mongoose = await connectDB();
    
    // Get connection status
    const connectionState = mongoose.connection.readyState;
    const connectionStateText = ['disconnected', 'connected', 'connecting', 'disconnecting'][connectionState] || 'unknown';
    
    console.log(`MongoDB connection state: ${connectionStateText} (${connectionState})`);
    
    // Return success response
    res.status(200).json({
      success: true,
      message: 'MongoDB connection test successful',
      connection: {
        state: connectionState,
        stateText: connectionStateText,
        host: mongoose.connection.host,
        name: mongoose.connection.name,
        isConnected: connectionState === 1
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('MongoDB connection test error:', error);
    
    res.status(500).json({
      success: false,
      message: 'MongoDB connection test failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}