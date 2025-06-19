export default function handler(req, res) {
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

  // Check environment variables
  const envVars = {
    NODE_ENV: process.env.NODE_ENV || 'not set',
    MONGODB_URI: process.env.MONGODB_URI ? 'set (value hidden)' : 'not set',
    JWT_SECRET: process.env.JWT_SECRET ? 'set (value hidden)' : 'not set',
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? 'set (value hidden)' : 'not set',
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? 'set (value hidden)' : 'not set',
    FRONTEND_URL: process.env.FRONTEND_URL || 'not set',
    OAUTH_CALLBACK_URL: process.env.OAUTH_CALLBACK_URL || 'not set',
    EMAIL_USER: process.env.EMAIL_USER ? 'set (value hidden)' : 'not set',
    EMAIL_PASS: process.env.EMAIL_PASS ? 'set (value hidden)' : 'not set',
  };

  // Return environment variable status
  res.status(200).json({
    message: 'Environment variables check',
    environment: process.env.NODE_ENV || 'development',
    variables: envVars,
    timestamp: new Date().toISOString()
  });
}