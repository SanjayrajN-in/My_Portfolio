import connectDB from '../config/database';

export default async function handler(req, res) {
  try {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    if (req.method !== 'GET') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    // Test database connection
    const mongoose = await connectDB();
    
    res.status(200).json({
      message: 'Database connection test',
      status: 'success',
      connectionState: mongoose.connection.readyState,
      connectionStateText: getConnectionStateText(mongoose.connection.readyState),
      host: mongoose.connection.host,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database connection test error:', error);
    res.status(500).json({
      message: 'Database connection test failed',
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

function getConnectionStateText(state) {
  switch (state) {
    case 0: return 'disconnected';
    case 1: return 'connected';
    case 2: return 'connecting';
    case 3: return 'disconnecting';
    default: return 'unknown';
  }
}