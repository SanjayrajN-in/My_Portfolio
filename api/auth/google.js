// Google OAuth Authentication Handler
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

// Simple in-memory user storage for now (replace with database later)
const users = new Map();

module.exports = async (req, res) => {
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
        const googleClientId = process.env.GOOGLE_CLIENT_ID || '1026303958134-nncar1hc3ko280tds9r7fa77f0d7cucu.apps.googleusercontent.com';
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

        // Simple user management (in-memory for now)
        let user = users.get(email);
        
        if (user) {
            console.log('✅ Existing user found');
            // Update user info
            user.name = name;
            user.avatar = picture || user.avatar;
            user.lastLogin = new Date().toISOString();
        } else {
            console.log('🆕 Creating new user');
            user = {
                id: googleId,
                googleId: googleId,
                name: name,
                email: email,
                avatar: picture || 'images/default-avatar.svg',
                isVerified: email_verified || true,
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
                gameStats: {
                    totalGamesPlayed: 0,
                    totalScore: 0,
                    achievements: [],
                    favoriteGame: null
                }
            };
            users.set(email, user);
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                userId: user.id,
                email: user.email,
                name: user.name
            },
            jwtSecret,
            { expiresIn: '7d' }
        );

        console.log('🎉 Login successful for user:', user.email);

        // Return success response
        const response = {
            success: true,
            message: 'Google login successful',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                gameStats: user.gameStats
            },
            token: token
        };

        console.log('📤 Sending response:', { success: true, userEmail: user.email });
        res.json(response);

    } catch (error) {
        console.error('💥 Google OAuth error:', error);
        
        res.status(500).json({
            success: false,
            message: 'Google authentication failed',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};