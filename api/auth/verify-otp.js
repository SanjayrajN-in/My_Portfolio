import connectDB from '../config/database';
import User from '../models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export default async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectDB();

    const { email, otp, type, userData } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    // Find user with matching email and OTP
    const user = await User.findOne({ 
      email: email.toLowerCase(),
      otp: otp,
      otpExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    if (type === 'register') {
      // Complete registration
      if (!userData || !userData.name || !userData.password) {
        return res.status(400).json({ message: 'Name and password are required for registration' });
      }

      // Validate password strength
      const passwordValidation = validatePassword(userData.password);
      if (!passwordValidation.isValid) {
        return res.status(400).json({ message: passwordValidation.message });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);

      // Update user with registration data
      user.name = userData.name;
      user.password = hashedPassword;
      user.isVerified = true;
      user.otp = null;
      user.otpExpires = null;
      user.avatar = 'images/default-avatar.svg';
      user.gameStats = {
        totalGamesPlayed: 0,
        totalPlaytime: 0,
        gamesHistory: [],
        achievements: []
      };

      await user.save();

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

      // Return user data
      const userResponse = {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        joinedDate: user.joinedDate,
        gameStats: user.gameStats,
        isVerified: true
      };

      res.status(201).json({
        success: true,
        message: 'Registration completed successfully!',
        user: userResponse,
        token: token
      });

    } else if (type === 'login') {
      // Verify login
      user.otp = null;
      user.otpExpires = null;
      user.lastLogin = new Date();
      await user.save();

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

      // Return user data
      const userResponse = {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        joinedDate: user.joinedDate,
        gameStats: user.gameStats,
        isVerified: true
      };

      res.status(200).json({
        success: true,
        message: 'Login successful!',
        user: userResponse,
        token: token
      });
    } else if (type === 'forgot-password') {
      // Verify OTP for password reset
      if (!userData || !userData.newPassword) {
        return res.status(400).json({ message: 'New password is required' });
      }

      // Validate password strength
      const passwordValidation = validatePassword(userData.newPassword);
      if (!passwordValidation.isValid) {
        return res.status(400).json({ message: passwordValidation.message });
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.newPassword, salt);

      // Update user password
      user.password = hashedPassword;
      user.otp = null;
      user.otpExpires = null;
      user.lastLogin = new Date();
      await user.save();

      res.status(200).json({
        success: true,
        message: 'Password reset successful! You can now login with your new password.'
      });
    }

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'Server error during OTP verification' });
  }
};

// Password validation function
function validatePassword(password) {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  if (password.length < minLength) {
    return {
      isValid: false,
      message: `Password must be at least ${minLength} characters long`
    };
  }
  
  if (!hasUpperCase) {
    return {
      isValid: false,
      message: 'Password must contain at least one uppercase letter'
    };
  }
  
  if (!hasLowerCase) {
    return {
      isValid: false,
      message: 'Password must contain at least one lowercase letter'
    };
  }
  
  if (!hasNumbers) {
    return {
      isValid: false,
      message: 'Password must contain at least one number'
    };
  }
  
  if (!hasSpecialChar) {
    return {
      isValid: false,
      message: 'Password must contain at least one special character (!@#$%^&*(),.?":{}|<>)'
    };
  }
  
  return {
    isValid: true,
    message: 'Password is valid'
  };
}