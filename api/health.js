// Enhanced health check endpoint
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('Health check requested from:', req.headers['user-agent']);
    
    // Get MongoDB URI (masked)
    const mongoUri = process.env.MONGODB_URI || 'Not set';
    const maskedMongoUri = mongoUri !== 'Not set' 
      ? mongoUri.replace(/:([^:@]+)@/, ':****@').substring(0, 30) + '...' 
      : 'Not set';
    
    // Get Google Client ID (masked)
    const googleClientId = process.env.GOOGLE_CLIENT_ID || 'Not set';
    const maskedGoogleClientId = googleClientId !== 'Not set'
      ? googleClientId.substring(0, 10) + '...'
      : 'Not set';
    
    // Basic health check that doesn't require database connection
    res.status(200).json({
      success: true,
      message: 'API is healthy',
      timestamp: new Date().toISOString(),
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        nodeEnv: process.env.NODE_ENV || 'Not set',
        vercelEnv: process.env.VERCEL_ENV || 'local'
      },
      config: {
        hasMongoURI: !!process.env.MONGODB_URI,
        mongoUriPrefix: maskedMongoUri,
        hasJwtSecret: !!process.env.JWT_SECRET,
        hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
        googleClientIdPrefix: maskedGoogleClientId,
        hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
        hasOauthCallbackUrl: !!process.env.OAUTH_CALLBACK_URL,
        oauthCallbackUrl: process.env.OAUTH_CALLBACK_URL || 'Not set'
      },
      apis: {
        testEndpoints: [
          '/api/health'
        ]
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}