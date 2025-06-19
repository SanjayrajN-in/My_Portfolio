import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { connectDB } from '../config/database.js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
    });
  }

  try {
    await connectDB();

    // Get token from Authorization header (optional for logout)
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      try {
        // Verify and decode token to get user info
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Update user's last activity (optional)
        await User.findByIdAndUpdate(decoded.userId, {
          lastLogin: new Date()
        });
      } catch (error) {
        // Token might be expired or invalid, but we still allow logout
        console.log('Token verification failed during logout:', error.message);
      }
    }

    // For JWT-based auth, logout is mainly client-side (removing token)
    // But we can perform any server-side cleanup here if needed
    
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout error:', error);
    
    // Even if there's an error, we should allow logout
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  }
}