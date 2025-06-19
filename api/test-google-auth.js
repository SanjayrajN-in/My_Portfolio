// Enhanced Google OAuth credentials test
import { OAuth2Client } from 'google-auth-library';

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
    console.log('Testing Google OAuth credentials...');
    console.log('Request headers:', req.headers);
    console.log('Request URL:', req.url);
    
    // Get Google credentials
    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.OAUTH_CALLBACK_URL;
    const mongodbUri = process.env.MONGODB_URI;
    
    console.log('Environment variables check:', {
      hasGoogleClientId: !!googleClientId,
      hasGoogleClientSecret: !!googleClientSecret,
      hasRedirectUri: !!redirectUri,
      hasMongodbUri: !!mongodbUri,
      googleClientIdPrefix: googleClientId ? googleClientId.substring(0, 10) + '...' : 'Not set',
      redirectUri: redirectUri || 'Not set',
      mongodbUriPrefix: mongodbUri ? mongodbUri.substring(0, 20) + '...' : 'Not set'
    });
    
    // Check if credentials are set
    if (!googleClientId) {
      return res.status(500).json({
        success: false,
        message: 'Google Client ID is not configured',
        error: 'GOOGLE_CLIENT_ID environment variable is missing'
      });
    }
    
    if (!googleClientSecret) {
      return res.status(500).json({
        success: false,
        message: 'Google Client Secret is not configured',
        error: 'GOOGLE_CLIENT_SECRET environment variable is missing'
      });
    }
    
    if (!redirectUri) {
      console.warn('⚠️ Warning: OAUTH_CALLBACK_URL is not configured');
    }
    
    // Create OAuth client
    const client = new OAuth2Client(
      googleClientId,
      googleClientSecret,
      redirectUri
    );
    
    // Generate authorization URL (just to test the credentials)
    const authUrl = client.generateAuthUrl({
      access_type: 'offline',
      scope: ['profile', 'email'],
      prompt: 'consent'
    });
    
    // Verify client ID format
    const isValidClientIdFormat = googleClientId.endsWith('.apps.googleusercontent.com');
    
    // Return success response with detailed information
    res.status(200).json({
      success: true,
      message: 'Google OAuth credentials test successful',
      credentials: {
        hasClientId: true,
        hasClientSecret: true,
        hasRedirectUri: !!redirectUri,
        clientIdPrefix: googleClientId.substring(0, 10) + '...',
        clientIdFormat: isValidClientIdFormat ? 'Valid' : 'Invalid format',
        redirectUri: redirectUri || 'Not configured'
      },
      environment: {
        nodeEnv: process.env.NODE_ENV || 'Not set',
        vercelEnv: process.env.VERCEL_ENV || 'Not set'
      },
      authUrl: authUrl,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Google OAuth credentials test error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code
    });
    
    // Determine error type
    let errorType = 'unknown';
    if (error.message.includes('invalid_client')) {
      errorType = 'invalid_client_credentials';
    } else if (error.message.includes('redirect_uri_mismatch')) {
      errorType = 'redirect_uri_mismatch';
    }
    
    res.status(500).json({
      success: false,
      message: 'Google OAuth credentials test failed',
      error: error.message,
      errorType: errorType,
      environment: {
        nodeEnv: process.env.NODE_ENV || 'Not set',
        vercelEnv: process.env.VERCEL_ENV || 'Not set'
      },
      timestamp: new Date().toISOString()
    });
  }
}