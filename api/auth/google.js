// Google OAuth Authentication Handler
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import connectDB from '../config/database';
import User from '../models/User';

export default async (req, res) => {
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

        // Environment variables check
        const googleClientId = process.env.GOOGLE_CLIENT_ID || '962387684215-f3ohlicfr8t1obvcojhlra04dd4kji2f.apps.googleusercontent.com';
        const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
        const jwtSecret = process.env.JWT_SECRET || 'fallback-jwt-secret-for-development';

        console.log('🔧 Environment check:', {
            hasClientId: !!googleClientId,
            hasClientSecret: !!googleClientSecret,
            hasJwtSecret: !!jwtSecret,
            clientIdPrefix: googleClientId ? googleClientId.substring(0, 10) + '...' : 'none'
        });

        if (!googleClientId) {
            console.error('❌ Missing GOOGLE_CLIENT_ID');
            return res.status(500).json({
                success: false,
                message: 'Server configuration error: Missing Google Client ID'
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

        // Connect to MongoDB with error handling
        try {
            console.log('🔄 Connecting to MongoDB...');
            await connectDB();
            console.log('✅ MongoDB connected successfully');
        } catch (dbError) {
            console.error('❌ MongoDB connection error:', dbError);
            console.error('MongoDB error stack:', dbError.stack);
            throw new Error(`Database connection failed: ${dbError.message}`);
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
            throw new Error(`User lookup failed: ${userError.message}`);
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
            throw new Error(`Failed to save user: ${saveError.message}`);
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
            throw new Error(`Failed to generate authentication token: ${jwtError.message}`);
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
            hasJwtSecret: !!process.env.JWT_SECRET,
            hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
            hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
            nodeEnv: process.env.NODE_ENV,
            vercelEnv: process.env.VERCEL_ENV
        });
        
        res.status(500).json({
            success: false,
            message: 'Google authentication failed',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};