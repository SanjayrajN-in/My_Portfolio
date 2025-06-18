const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { OAuth2Client } = require('google-auth-library');
const connectDB = require('../config/database');

module.exports = async (req, res) => {
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
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
    res.setHeader('Vary', 'Origin'); // Important for FedCM
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups'); // For popup auth
    res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none'); // Allow embedding
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        console.log('CORS preflight request handled');
        res.status(200).end();
        return;
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            message: 'Method not allowed'
        });
    }

    try {
        // Connect to database
        await connectDB();
        
        console.log('Google OAuth API called:', {
            method: req.method,
            origin: req.headers.origin,
            userAgent: req.headers['user-agent'],
            body: req.body ? { ...req.body, code: req.body.code ? '[REDACTED]' : undefined } : null,
            hasEnvVars: {
                clientId: !!process.env.GOOGLE_CLIENT_ID,
                clientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
                jwtSecret: !!process.env.JWT_SECRET
            }
        });
        
        const { credential, code, redirect_uri } = req.body;
        
        // Validate required environment variables
        if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
            console.error('Missing Google OAuth environment variables');
            return res.status(500).json({
                success: false,
                message: 'Server configuration error'
            });
        }

        if (!process.env.JWT_SECRET) {
            console.error('Missing JWT_SECRET environment variable');
            return res.status(500).json({
                success: false,
                message: 'Server configuration error'
            });
        }
        
        // Handle both JWT token (old method) and OAuth code (new method)
        let payload;
        
        if (code && redirect_uri) {
            // New OAuth code flow
            console.log('Processing OAuth code flow');
            console.log('Redirect URI:', redirect_uri);
            
            const client = new OAuth2Client(
                process.env.GOOGLE_CLIENT_ID,
                process.env.GOOGLE_CLIENT_SECRET,
                redirect_uri
            );
            
            console.log('Exchanging code for tokens...');
            
            try {
                // Exchange code for tokens
                const { tokens } = await client.getToken(code);
                console.log('Tokens received:', { 
                    hasIdToken: !!tokens.id_token,
                    hasAccessToken: !!tokens.access_token,
                    hasRefreshToken: !!tokens.refresh_token
                });
                
                client.setCredentials(tokens);
                
                // Verify the ID token
                const ticket = await client.verifyIdToken({
                    idToken: tokens.id_token,
                    audience: process.env.GOOGLE_CLIENT_ID,
                });
                
                payload = ticket.getPayload();
                console.log('User payload extracted:', { 
                    sub: payload.sub, 
                    email: payload.email, 
                    name: payload.name,
                    email_verified: payload.email_verified
                });
                
            } catch (tokenError) {
                console.error('Token exchange error:', tokenError);
                return res.status(400).json({
                    success: false,
                    message: 'Invalid authorization code'
                });
            }
            
        } else if (credential) {
            // Old JWT token flow (fallback)
            console.log('Processing JWT credential flow');
            
            const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
            
            try {
                const ticket = await client.verifyIdToken({
                    idToken: credential,
                    audience: process.env.GOOGLE_CLIENT_ID,
                });
                
                payload = ticket.getPayload();
                console.log('JWT payload extracted:', { 
                    sub: payload.sub, 
                    email: payload.email, 
                    name: payload.name 
                });
                
            } catch (jwtError) {
                console.error('JWT verification error:', jwtError);
                return res.status(400).json({
                    success: false,
                    message: 'Invalid Google token'
                });
            }
            
        } else {
            return res.status(400).json({
                success: false,
                message: 'Google credential or authorization code is required'
            });
        }
        
        // Extract user information
        const { sub: googleId, email, name, picture, email_verified } = payload;

        // Validate required fields
        if (!googleId || !email || !name) {
            console.error('Missing required user data from Google:', { googleId: !!googleId, email: !!email, name: !!name });
            return res.status(400).json({
                success: false,
                message: 'Incomplete user data from Google'
            });
        }

        console.log('Processing user data:', { googleId, email, name, hasAvatar: !!picture });

        // Check if user exists
        let user = await User.findOne({ 
            $or: [
                { email: email },
                { googleId: googleId }
            ]
        });

        if (user) {
            console.log('Existing user found:', user._id);
            // Update existing user with Google info if not already set
            let updated = false;
            
            if (!user.googleId) {
                user.googleId = googleId;
                updated = true;
            }
            if (!user.avatar && picture) {
                user.avatar = picture;
                updated = true;
            }
            if (!user.isVerified && email_verified) {
                user.isVerified = true;
                updated = true;
            }
            
            if (updated) {
                await user.save();
                console.log('User updated with Google info');
            }
        } else {
            console.log('Creating new user');
            // Create new user
            user = new User({
                name: name,
                email: email,
                googleId: googleId,
                avatar: picture || 'images/default-avatar.svg',
                isVerified: email_verified || true, // Google accounts are typically pre-verified
                gameStats: {
                    totalGamesPlayed: 0,
                    totalScore: 0,
                    achievements: [],
                    favoriteGame: null
                }
            });
            
            try {
                await user.save();
                console.log('New user created:', user._id);
            } catch (saveError) {
                console.error('Error saving new user:', saveError);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to create user account'
                });
            }
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                userId: user._id,
                email: user.email,
                name: user.name
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        console.log('Login successful for user:', user._id);

        res.json({
            success: true,
            message: 'Google login successful',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                gameStats: user.gameStats
            },
            token: token
        });

    } catch (error) {
        console.error('Google OAuth error:', error);
        
        // Handle specific error types
        if (error.message.includes('Token used too early') || 
            error.message.includes('Token used too late') ||
            error.message.includes('Invalid token signature')) {
            return res.status(401).json({
                success: false,
                message: 'Invalid Google token'
            });
        }

        if (error.message.includes('Network Error') || error.message.includes('ENOTFOUND')) {
            return res.status(503).json({
                success: false,
                message: 'Network error - please try again'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Google authentication failed',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};