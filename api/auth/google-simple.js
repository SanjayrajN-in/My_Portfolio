// Simple Google OAuth Authentication Handler
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import mongoose from 'mongoose';
import User from '../models/User';

// Connect to MongoDB directly
const connectDB = async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 15000,
        connectTimeoutMS: 30000,
        socketTimeoutMS: 60000,
        maxPoolSize: 10,
        family: 4,
        retryWrites: true,
        w: 'majority'
      });
      console.log('MongoDB Connected');
    }
    return true;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    return false;
  }
};

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
  
  try {
    console.log('Google Auth API called');
    
    // Get request body
    const { credential } = req.body;
    
    if (!credential) {
      return res.status(400).json({ 
        success: false, 
        message: 'Google credential is required' 
      });
    }
    
    // Verify the Google token
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const client = new OAuth2Client(clientId);
    
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: clientId,
    });
    
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;
    
    console.log('Google user verified:', { email, name });
    
    // Connect to MongoDB
    const dbConnected = await connectDB();
    if (!dbConnected) {
      return res.status(500).json({ 
        success: false, 
        message: 'Database connection failed' 
      });
    }
    
    // Find or create user
    let user = await User.findOne({ 
      $or: [
        { email },
        { googleId }
      ]
    });
    
    if (user) {
      // Update existing user
      user.name = name;
      user.avatar = picture || user.avatar;
      user.lastLogin = new Date();
      user.isVerified = true;
      
      if (!user.googleId) {
        user.googleId = googleId;
      }
      
      await user.save();
    } else {
      // Create new user
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
        name: user.name
      },
      process.env.JWT_SECRET || 'fallback-jwt-secret',
      { expiresIn: '7d' }
    );
    
    // Return success response
    return res.status(200).json({
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
      token
    });
    
  } catch (error) {
    console.error('Google Auth Error:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Authentication failed',
      error: error.message
    });
  }
}