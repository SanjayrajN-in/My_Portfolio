// Utility API endpoints
import connectDB from './config/database';
import mongoose from 'mongoose';

// Set CORS headers helper function
const setCorsHeaders = (req, res) => {
  const allowedOrigins = [
    'https://sanjayrajn.vercel.app',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'https://sanjayrajn.vercel.app');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Cache-Control');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');
  res.setHeader('Vary', 'Origin');
};

// Handle Hello endpoint
const handleHello = async (req, res) => {
  res.status(200).json({
    message: 'Hello from Vercel Serverless Function!',
    timestamp: new Date().toISOString(),
    success: true,
    environment: process.env.NODE_ENV || 'development'
  });
};

// Handle Test endpoint
const handleTest = async (req, res) => {
  // Return simple test response
  res.json({
    success: true,
    message: 'API is working!',
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
      vercelEnv: process.env.VERCEL_ENV || 'local'
    }
  });
};

// Handle Debug endpoint
const handleDebug = async (req, res) => {
  // Return detailed debug information
  res.json({
    success: true,
    message: 'Debug information',
    timestamp: new Date().toISOString(),
    request: {
      method: req.method,
      url: req.url,
      query: req.query,
      headers: {
        origin: req.headers.origin,
        'content-type': req.headers['content-type'],
        'user-agent': req.headers['user-agent']
      }
    },
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      env: process.env.NODE_ENV || 'development',
      vercelEnv: process.env.VERCEL_ENV || 'local'
    },
    auth: {
      hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      hasJwtSecret: !!process.env.JWT_SECRET,
      hasMongoUri: !!process.env.MONGODB_URI
    }
  });
};

// Handle DB Test endpoint
const handleDbTest = async (req, res) => {
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
};

// Main handler
export default async function handler(req, res) {
  // Set CORS headers
  setCorsHeaders(req, res);
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Get the endpoint from the query
  const { endpoint } = req.query;

  // Log request details
  console.log('🔄 Utils API handler called:', {
    method: req.method,
    url: req.url,
    query: req.query,
    endpoint: endpoint,
    timestamp: new Date().toISOString()
  });

  // If no endpoint is specified, return API info
  if (!endpoint) {
    console.log('ℹ️ No endpoint specified, returning API info');
    return res.status(200).json({
      success: true,
      message: 'Utils API root',
      endpoints: ['hello', 'test', 'debug', 'db-test'],
      timestamp: new Date().toISOString()
    });
  }

  // Route to the appropriate handler based on the endpoint
  switch (endpoint) {
    case 'hello':
      console.log('✅ Routing to Hello handler');
      return handleHello(req, res);
    case 'test':
      console.log('✅ Routing to Test handler');
      return handleTest(req, res);
    case 'debug':
      console.log('✅ Routing to Debug handler');
      return handleDebug(req, res);
    case 'db-test':
      console.log('✅ Routing to DB Test handler');
      return handleDbTest(req, res);
    default:
      console.log('❌ Endpoint not found:', endpoint);
      return res.status(404).json({ 
        success: false,
        message: `Endpoint not found: ${endpoint}` 
      });
  }
}