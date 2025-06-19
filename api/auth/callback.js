// Google OAuth Callback Handler
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import connectDB from '../config/database';
import User from '../models/User';

export default async function handler(req, res) {
  console.log('🔄 Google OAuth Callback received:', {
    method: req.method,
    query: req.query,
    timestamp: new Date().toISOString()
  });

  // Set CORS headers
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
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow GET requests (OAuth redirects are GET)
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }

  try {
    // Get code and state from query parameters
    const { code, state, error } = req.query;
    
    // Check for OAuth errors
    if (error) {
      console.error('❌ OAuth error:', error);
      return res.redirect(`/?auth_error=${encodeURIComponent(error)}`);
    }
    
    // Validate required parameters
    if (!code) {
      console.error('❌ Missing authorization code');
      return res.redirect('/?auth_error=missing_code');
    }

    // Environment variables check
    const googleClientId = process.env.GOOGLE_CLIENT_ID || '962387684215-f3ohlicfr8t1obvcojhlra04dd4kji2f.apps.googleusercontent.com';
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const jwtSecret = process.env.JWT_SECRET || 'fallback-jwt-secret-for-development';
    const redirectUri = process.env.OAUTH_CALLBACK_URL || `${process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'http://localhost:3000'}/api/auth/callback`;

    console.log('🔧 Environment check:', {
      hasClientId: !!googleClientId,
      hasClientSecret: !!googleClientSecret,
      hasJwtSecret: !!jwtSecret,
      redirectUri
    });

    if (!googleClientId || !googleClientSecret) {
      console.error('❌ Missing Google OAuth credentials');
      return res.redirect('/?auth_error=server_configuration');
    }

    // Initialize OAuth client
    const client = new OAuth2Client(
      googleClientId,
      googleClientSecret,
      redirectUri
    );

    // Exchange code for tokens
    console.log('🔄 Exchanging code for tokens...');
    const { tokens } = await client.getToken(code);
    console.log('✅ Tokens received');

    // Verify ID token
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: googleClientId,
    });
    
    // Get user info from token
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;
    
    console.log('✅ User authenticated:', { 
      googleId, 
      email, 
      name,
      hasAvatar: !!picture 
    });

    // Connect to MongoDB
    console.log('🔄 Connecting to MongoDB...');
    await connectDB();
    console.log('✅ MongoDB connected');

    // Find or create user
    let user = await User.findOne({ 
      $or: [
        { email },
        { googleId }
      ]
    });

    if (user) {
      console.log('✅ Existing user found');
      // Update user info
      user.name = name;
      user.avatar = picture || user.avatar;
      user.lastLogin = new Date();
      user.isVerified = true;
      
      // If user exists but doesn't have googleId, add it
      if (!user.googleId) {
        user.googleId = googleId;
      }
      
      await user.save();
    } else {
      console.log('🆕 Creating new user');
      user = new User({
        googleId,
        name,
        email,
        avatar: picture || 'images/default-avatar.svg',
        isVerified: true,
        joinedDate: new Date(),
        lastLogin: new Date(),
        gameStats: {
          totalGamesPlayed: 0,
          totalPlaytime: 0,
          gamesHistory: [],
          achievements: []
        }
      });
      
      await user.save();
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id.toString(),
        email: user.email,
        name: user.name,
        googleId: user.googleId
      },
      jwtSecret,
      { expiresIn: '7d' }
    );

    // Create HTML response with auto-close script
    const htmlResponse = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Authentication Successful</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            background-color: #f5f5f5;
            color: #333;
          }
          .card {
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            padding: 2rem;
            text-align: center;
            max-width: 400px;
          }
          .success-icon {
            color: #4caf50;
            font-size: 48px;
            margin-bottom: 1rem;
          }
          h1 {
            margin-top: 0;
          }
          p {
            margin: 1rem 0;
            line-height: 1.5;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="success-icon">✓</div>
          <h1>Login Successful!</h1>
          <p>You have successfully logged in with Google.</p>
          <p>This window will close automatically in a few seconds.</p>
          <p>If it doesn't close, you can close it manually.</p>
        </div>
        
        <script>
          // Store user data and token in localStorage
          try {
            localStorage.setItem('token', ${JSON.stringify(token)});
            localStorage.setItem('user', ${JSON.stringify(JSON.stringify({
              id: user._id.toString(),
              name: user.name,
              email: user.email,
              avatar: user.avatar,
              joinedDate: user.joinedDate,
              gameStats: user.gameStats,
              isGoogleAuth: true
            }))});
            
            // Notify opener window if available
            if (window.opener && !window.opener.closed) {
              window.opener.postMessage({ 
                type: 'GOOGLE_AUTH_SUCCESS',
                token: ${JSON.stringify(token)},
                user: ${JSON.stringify({
                  id: user._id.toString(),
                  name: user.name,
                  email: user.email,
                  avatar: user.avatar,
                  joinedDate: user.joinedDate,
                  gameStats: user.gameStats,
                  isGoogleAuth: true
                })}
              }, '*');
            }
          } catch (e) {
            console.error('Error storing auth data:', e);
          }
          
          // Close window after a short delay
          setTimeout(() => {
            window.close();
          }, 3000);
        </script>
      </body>
      </html>
    `;

    // Send HTML response
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(htmlResponse);
    
  } catch (error) {
    console.error('❌ OAuth callback error:', error);
    
    // Redirect to home with error
    res.redirect(`/?auth_error=${encodeURIComponent(error.message || 'Unknown error')}`);
  }
}