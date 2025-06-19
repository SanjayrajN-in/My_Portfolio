// Google OAuth Authentication Handler
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import connectDB from '../config/database';
import User from '../models/User';

// Fallback values for development
const FALLBACK_JWT_SECRET = 'fallback-jwt-secret-for-development-only';
const FALLBACK_CLIENT_ID = '962387684215-f3ohlicfr8t1obvcojhlra04dd4kji2f.apps.googleusercontent.com';

export default async function handler(req, res) {
  // Add error handling for the entire function
  try {
    console.log('🔐 Google Auth API called:', {
        method: req.method,
        url: req.url,
        origin: req.headers.origin,
        timestamp: new Date().toISOString()
    });

    // Set comprehensive CORS headers
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
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        console.log('✅ CORS preflight request handled');
        res.status(200).end();
        return;
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        console.log('❌ Method not allowed:', req.method);
        return res.status(405).json({
            success: false,
            message: 'Method not allowed'
        });
    }

    try {
        console.log('📨 Processing Google OAuth request...');
        
        // Get request body
        const { credential, code, redirect_uri, popup_mode, callback_mode } = req.body;
        
        console.log('📋 Request details:', {
            hasCredential: !!credential,
            hasCode: !!code,
            redirectUri: redirect_uri,
            isPopupMode: popup_mode,
            isCallbackMode: callback_mode
        });

        // Environment variables check with fallbacks for development
        const googleClientId = process.env.GOOGLE_CLIENT_ID || FALLBACK_CLIENT_ID;
        const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || 'dummy-secret-for-development';
        const jwtSecret = process.env.JWT_SECRET || FALLBACK_JWT_SECRET;
        const mongodbUri = process.env.MONGODB_URI || 'mongodb+srv://dummy:dummy@cluster0.mongodb.net/portfolio?retryWrites=true&w=majority';

        console.log('🔧 Environment check:', {
            hasClientId: !!googleClientId,
            hasClientSecret: !!googleClientSecret,
            hasJwtSecret: !!jwtSecret,
            hasMongodbUri: !!mongodbUri,
            clientIdPrefix: googleClientId ? googleClientId.substring(0, 10) + '...' : 'none',
            mongodbUriPrefix: mongodbUri ? mongodbUri.substring(0, 20) + '...' : 'none'
        });

        // For development environment, we'll use fallbacks
        // For production, we'll require the actual environment variables
        const isProduction = process.env.NODE_ENV === 'production';
        
        if (!googleClientId) {
            console.error('❌ Missing GOOGLE_CLIENT_ID');
            return res.status(500).json({
                success: false,
                message: 'Server configuration error: Missing Google Client ID'
            });
        }
        
        // In production, we require the actual client secret
        if (isProduction && !process.env.GOOGLE_CLIENT_SECRET) {
            console.error('❌ Missing GOOGLE_CLIENT_SECRET in production');
            return res.status(500).json({
                success: false,
                message: 'Server configuration error: Missing Google Client Secret'
            });
        }

        let payload;
        
        // Handle JWT credential (from Google Identity Services)
        if (credential) {
            console.log('🔍 Processing JWT credential...');
            
            const client = new OAuth2Client(googleClientId);
            
            try {
                const ticket = await client.verifyIdToken({
                    idToken: credential,
                    audience: googleClientId,
                });
                
                payload = ticket.getPayload();
                console.log('✅ JWT credential verified:', { 
                    sub: payload.sub, 
                    email: payload.email, 
                    name: payload.name 
                });
                
            } catch (jwtError) {
                console.error('❌ JWT verification error:', jwtError.message);
                return res.status(400).json({
                    success: false,
                    message: 'Invalid Google credential'
                });
            }
        }
        // Handle OAuth code (from redirect flow)
        else if (code && redirect_uri) {
            console.log('🔍 Processing OAuth code...');
            
            if (!googleClientSecret) {
                console.error('❌ Missing GOOGLE_CLIENT_SECRET for OAuth flow');
                return res.status(500).json({
                    success: false,
                    message: 'Server configuration error: OAuth not properly configured'
                });
            }
            
            const client = new OAuth2Client(
                googleClientId,
                googleClientSecret,
                redirect_uri
            );
            
            try {
                const { tokens } = await client.getToken(code);
                console.log('✅ Tokens received:', { 
                    hasIdToken: !!tokens.id_token,
                    hasAccessToken: !!tokens.access_token
                });
                
                const ticket = await client.verifyIdToken({
                    idToken: tokens.id_token,
                    audience: googleClientId,
                });
                
                payload = ticket.getPayload();
                console.log('✅ OAuth code verified:', { 
                    sub: payload.sub, 
                    email: payload.email, 
                    name: payload.name 
                });
                
            } catch (oauthError) {
                console.error('❌ OAuth code error:', oauthError.message);
                return res.status(400).json({
                    success: false,
                    message: 'Invalid authorization code'
                });
            }
        }
        else {
            console.error('❌ No credential or code provided');
            return res.status(400).json({
                success: false,
                message: 'Google credential or authorization code is required'
            });
        }
        
        // Extract user information
        const { sub: googleId, email, name, picture, email_verified } = payload;

        if (!googleId || !email || !name) {
            console.error('❌ Missing required user data:', { googleId: !!googleId, email: !!email, name: !!name });
            return res.status(400).json({
                success: false,
                message: 'Incomplete user data from Google'
            });
        }

        console.log('👤 Processing user:', { googleId, email, name, hasAvatar: !!picture });

        // Connect to MongoDB with improved error handling
        try {
            console.log('🔄 Connecting to MongoDB...');
            await connectDB();
            console.log('✅ MongoDB connected successfully');
        } catch (dbError) {
            console.error('❌ MongoDB connection error:', dbError);
            console.error('MongoDB error stack:', dbError.stack);
            
            // Return a specific error response instead of throwing
            return res.status(500).json({
                success: false,
                message: 'Database connection failed',
                error: dbError.message,
                errorType: 'database_connection',
                timestamp: new Date().toISOString()
            });
        }

        // Find or create user in MongoDB
        let user;
        try {
            console.log('🔍 Looking for existing user...');
            user = await User.findOne({ 
                $or: [
                    { email: email },
                    { googleId: googleId }
                ]
            });
            console.log('✅ User query completed:', { found: !!user });
        } catch (userError) {
            console.error('❌ User lookup error:', userError);
            console.error('User lookup error stack:', userError.stack);
            
            // Return a specific error response instead of throwing
            return res.status(500).json({
                success: false,
                message: 'Failed to look up user in database',
                error: userError.message,
                errorType: 'database_query',
                timestamp: new Date().toISOString()
            });
        }
        
        try {
            if (user) {
                console.log('✅ Existing user found');
                // Update user info
                user.name = name;
                user.avatar = picture || user.avatar;
                user.lastLogin = new Date();
                user.isVerified = true; // Google users are automatically verified
                
                // If user exists but doesn't have googleId, add it
                if (!user.googleId) {
                    user.googleId = googleId;
                }
                
                // Clear any pending OTP since this is Google auth
                user.otp = null;
                user.otpExpires = null;
                
                console.log('🔄 Saving updated user...');
                await user.save();
                console.log('✅ User updated successfully');
            } else {
                console.log('🆕 Creating new user');
                user = new User({
                    googleId: googleId,
                    name: name,
                    email: email,
                    avatar: picture || 'images/default-avatar.svg',
                    isVerified: true, // Google users are automatically verified
                    joinedDate: new Date(),
                    lastLogin: new Date(),
                    gameStats: {
                        totalGamesPlayed: 0,
                        totalPlaytime: 0,
                        gamesHistory: [],
                        achievements: []
                    }
                });
                
                console.log('🔄 Saving new user...');
                await user.save();
                console.log('✅ New user created successfully');
            }
        } catch (saveError) {
            console.error('❌ Error saving user:', saveError);
            console.error('Save error stack:', saveError.stack);
            
            // Return a specific error response instead of throwing
            return res.status(500).json({
                success: false,
                message: 'Failed to save user data',
                error: saveError.message,
                errorType: 'database_save',
                timestamp: new Date().toISOString()
            });
        }

        // Generate JWT token with error handling
        let token;
        try {
            console.log('🔄 Generating JWT token...');
            if (!jwtSecret) {
                console.error('❌ Missing JWT_SECRET environment variable');
                throw new Error('JWT_SECRET environment variable is not defined');
            }
               
            token = jwt.sign(
                { 
                    userId: user._id.toString(),
                    email: user.email,
                    name: user.name,
                    googleId: user.googleId
                },
                jwtSecret,
                { expiresIn: '7d' }
            );
            console.log('✅ JWT token generated successfully');
        } catch (jwtError) {
            console.error('❌ JWT token generation error:', jwtError);
            console.error('JWT error stack:', jwtError.stack);
            
            // Return a specific error response instead of throwing
            return res.status(500).json({
                success: false,
                message: 'Failed to generate authentication token',
                error: jwtError.message,
                errorType: 'jwt_generation',
                timestamp: new Date().toISOString()
            });
        }

        console.log('🎉 Login successful for user:', user.email);

        // Return success response
        const response = {
            success: true,
            message: 'Google login successful',
            user: {
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                joinedDate: user.joinedDate,
                gameStats: user.gameStats,
                isGoogleAuth: true
            },
            token: token
        };

        console.log('📤 Sending response:', { success: true, userEmail: user.email });
        res.json(response);

    } catch (error) {
        console.error('💥 Google OAuth error:', error);
        console.error('Error stack:', error.stack);
        console.error('Error details:', {
            name: error.name,
            message: error.message,
            code: error.code,
            status: error.status
        });
        
        // Log environment variables (without exposing secrets)
        console.log('Environment check:', {
            hasMongoURI: !!process.env.MONGODB_URI,
            mongoURIPrefix: process.env.MONGODB_URI ? process.env.MONGODB_URI.substring(0, 20) + '...' : 'not set',
            hasJwtSecret: !!process.env.JWT_SECRET,
            hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
            hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
            hasOauthCallbackUrl: !!process.env.OAUTH_CALLBACK_URL,
            oauthCallbackUrl: process.env.OAUTH_CALLBACK_URL || 'not set',
            nodeEnv: process.env.NODE_ENV,
            vercelEnv: process.env.VERCEL_ENV
        });
        
        // Provide more detailed error information
        let errorMessage = 'Google authentication failed';
        let errorType = 'unknown';
        
        if (error.message.includes('MongoDB')) {
            errorType = 'database';
            errorMessage = 'Database connection issue';
        } else if (error.message.includes('verify') || error.message.includes('token') || error.message.includes('credential')) {
            errorType = 'google_auth';
            errorMessage = 'Google authentication verification failed';
        } else if (error.message.includes('JWT')) {
            errorType = 'jwt';
            errorMessage = 'Token generation failed';
        }
        
        res.status(500).json({
            success: false,
            message: errorMessage,
            errorType: errorType,
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
            timestamp: new Date().toISOString()
        });
    }
  } catch (outerError) {
    // This is a fallback error handler in case something goes wrong in the main error handler
    console.error('CRITICAL ERROR in Google Auth handler:', outerError);
    
    // Send a simple error response
    res.status(500).json({
      success: false,
      message: 'A critical error occurred in the authentication service',
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
};