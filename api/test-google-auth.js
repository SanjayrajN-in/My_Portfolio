// Simple Google OAuth credentials test
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
    
    // Get Google credentials
    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.OAUTH_CALLBACK_URL;
    
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
    
    // Return success response
    res.status(200).json({
      success: true,
      message: 'Google OAuth credentials test successful',
      credentials: {
        hasClientId: true,
        hasClientSecret: true,
        clientIdPrefix: googleClientId.substring(0, 10) + '...',
        redirectUri: redirectUri || 'Not configured'
      },
      authUrl: authUrl,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Google OAuth credentials test error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Google OAuth credentials test failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}