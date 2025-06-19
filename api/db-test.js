// MongoDB connection test endpoint
import connectDB from './config/database';

export default async function handler(req, res) {
  // Set CORS headers
  const allowedOrigins = [
    'https://sanjayrajn.vercel.app',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
  ];
  
  // Get the origin from the request headers
  const origin = req.headers.origin;
  
  // Set the appropriate CORS headers based on the origin
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    // Default to the production URL
    res.setHeader('Access-Control-Allow-Origin', 'https://sanjayrajn.vercel.app');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('🔄 Testing MongoDB connection...');
    
    // Check if MONGODB_URI is defined
    if (!process.env.MONGODB_URI) {
      console.error('❌ MONGODB_URI environment variable is not defined');
      return res.status(500).json({ 
        success: false, 
        message: 'MongoDB URI is not configured',
        error: 'MONGODB_URI environment variable is missing'
      });
    }
    
    // Try to connect to MongoDB
    const mongoose = await connectDB();
    
    // Get connection status
    const connectionState = mongoose.connection.readyState;
    const connectionStateText = ['disconnected', 'connected', 'connecting', 'disconnecting'][connectionState] || 'unknown';
    
    console.log(`✅ MongoDB connection state: ${connectionStateText} (${connectionState})`);
    
    // Return connection status
    res.status(200).json({
      success: true,
      message: 'MongoDB connection test completed',
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
    console.error('❌ MongoDB connection test error:', error);
    
    res.status(500).json({
      success: false,
      message: 'MongoDB connection test failed',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
  }
}