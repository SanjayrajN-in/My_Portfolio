// Environment Variables Test API
// This endpoint helps diagnose environment variable issues

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
    console.log('Testing environment variables...');
    
    // Get environment variables (mask sensitive parts)
    const mongodbUri = process.env.MONGODB_URI || 'Not set';
    const googleClientId = process.env.GOOGLE_CLIENT_ID || 'Not set';
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || 'Not set';
    const jwtSecret = process.env.JWT_SECRET || 'Not set';
    const oauthCallbackUrl = process.env.OAUTH_CALLBACK_URL || 'Not set';
    
    // Mask sensitive information
    const maskedMongoUri = mongodbUri !== 'Not set' 
      ? mongodbUri.replace(/:([^:@]+)@/, ':****@').substring(0, 30) + '...' 
      : 'Not set';
    
    const maskedGoogleClientId = googleClientId !== 'Not set'
      ? googleClientId.substring(0, 10) + '...'
      : 'Not set';
    
    const maskedGoogleClientSecret = googleClientSecret !== 'Not set'
      ? googleClientSecret.substring(0, 5) + '...'
      : 'Not set';
    
    const maskedJwtSecret = jwtSecret !== 'Not set'
      ? jwtSecret.substring(0, 5) + '...'
      : 'Not set';
    
    // Return environment status
    res.status(200).json({
      success: true,
      message: 'Environment variables test',
      environment: {
        nodeEnv: process.env.NODE_ENV || 'Not set',
        vercelEnv: process.env.VERCEL_ENV || 'Not set',
      },
      variables: {
        mongodbUri: {
          isSet: mongodbUri !== 'Not set',
          value: maskedMongoUri,
          format: mongodbUri.startsWith('mongodb+srv://') ? 'Valid MongoDB URI format' : 'Invalid format'
        },
        googleClientId: {
          isSet: googleClientId !== 'Not set',
          value: maskedGoogleClientId,
          format: googleClientId.endsWith('.apps.googleusercontent.com') ? 'Valid format' : 'Invalid format'
        },
        googleClientSecret: {
          isSet: googleClientSecret !== 'Not set',
          value: maskedGoogleClientSecret
        },
        jwtSecret: {
          isSet: jwtSecret !== 'Not set',
          value: maskedJwtSecret
        },
        oauthCallbackUrl: {
          isSet: oauthCallbackUrl !== 'Not set',
          value: oauthCallbackUrl
        }
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Environment test error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Environment test failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}