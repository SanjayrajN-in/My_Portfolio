const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { OAuth2Client } = require('google-auth-library');
const connectDB = require('../config/database');

module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', 'https://sanjayrajn.vercel.app');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        // Connect to database
        await connectDB();
        
        console.log('Google OAuth API called:', {
            method: req.method,
            body: req.body,
            hasEnvVars: {
                clientId: !!process.env.GOOGLE_CLIENT_ID,
                clientSecret: !!process.env.GOOGLE_CLIENT_SECRET
            }
        });
        
        const { credential, code, redirect_uri } = req.body;
        
        // Handle both JWT token (old method) and OAuth code (new method)
        let payload;
        
        if (code && redirect_uri) {
            // New OAuth code flow
            console.log('Processing OAuth code flow');
            console.log('Redirect URI:', redirect_uri);
            
            if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
                throw new Error('Google OAuth environment variables not configured');
            }
            
            const client = new OAuth2Client(
                process.env.GOOGLE_CLIENT_ID,
                process.env.GOOGLE_CLIENT_SECRET,
                redirect_uri
            );
            
            console.log('Exchanging code for tokens...');
            
            // Exchange code for tokens
            const { tokens } = await client.getToken(code);
            console.log('Tokens received:', { hasIdToken: !!tokens.id_token });
            
            client.setCredentials(tokens);
            
            // Verify the ID token
            const ticket = await client.verifyIdToken({
                idToken: tokens.id_token,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
            
            payload = ticket.getPayload();
            console.log('User payload:', { 
                sub: payload.sub, 
                email: payload.email, 
                name: payload.name 
            });
            
        } else if (credential) {
            // Old JWT token flow (fallback)
            console.log('Processing JWT credential flow');
            
            const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
            
            const ticket = await client.verifyIdToken({
                idToken: credential,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
            
            payload = ticket.getPayload();
            
        } else {
            return res.status(400).json({
                success: false,
                message: 'Google credential or authorization code is required'
            });
        }
        
        const { sub: googleId, email, name, picture } = payload;

        // Check if user exists
        let user = await User.findOne({ 
            $or: [
                { email: email },
                { googleId: googleId }
            ]
        });

        if (user) {
            // Update existing user with Google info if not already set
            if (!user.googleId) {
                user.googleId = googleId;
            }
            if (!user.avatar && picture) {
                user.avatar = picture;
            }
            await user.save();
        } else {
            // Create new user
            user = new User({
                name: name,
                email: email,
                googleId: googleId,
                avatar: picture || 'images/default-avatar.svg',
                isVerified: true, // Google accounts are pre-verified
                gameStats: {
                    totalGamesPlayed: 0,
                    totalScore: 0,
                    achievements: [],
                    favoriteGame: null
                }
            });
            await user.save();
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
        
        if (error.message.includes('Token used too early') || 
            error.message.includes('Token used too late') ||
            error.message.includes('Invalid token signature')) {
            return res.status(401).json({
                success: false,
                message: 'Invalid Google token'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Google authentication failed'
        });
    }
};