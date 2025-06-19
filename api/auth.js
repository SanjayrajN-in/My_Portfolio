// Consolidated Auth API Handler
import connectDB from './config/database';
import User from './models/User';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Set CORS headers helper function
const setCorsHeaders = (req, res) => {
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
};

// Handle Google OAuth
const handleGoogleAuth = async (req, res) => {
  console.log('🔐 Google Auth API called:', {
    method: req.method,
    url: req.url,
    origin: req.headers.origin,
    timestamp: new Date().toISOString()
  });
  
  // Log request headers for debugging
  console.log('📋 Request headers:', req.headers);
  
  try {
    // Log request body (without sensitive data)
    const safeBody = { ...req.body };
    if (safeBody.credential) safeBody.credential = `${safeBody.credential.substring(0, 10)}...`;
    if (safeBody.code) safeBody.code = `${safeBody.code.substring(0, 10)}...`;
    console.log('📋 Request body (sanitized):', safeBody);
    
    console.log('📨 Processing Google OAuth request...');
    
    // Check if request body exists
    if (!req.body) {
      console.error('❌ Request body is missing');
      return res.status(400).json({
        success: false,
        message: 'Request body is missing',
        error: 'No request body provided'
      });
    }
    
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

// Handle Login
const handleLogin = async (req, res) => {
  try {
    await connectDB();

    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id.toString(),
        email: user.email,
        name: user.name
      },
      process.env.JWT_SECRET || 'fallback-jwt-secret-for-development',
      { expiresIn: '7d' }
    );

    // Return user data without password
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      joinedDate: user.joinedDate,
      gameStats: user.gameStats
    };

    res.status(200).json({ 
      success: true,
      message: 'Login successful!',
      user: userResponse,
      token: token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during login' 
    });
  }
};

// Handle Registration
const handleRegister = async (req, res) => {
  try {
    await connectDB();

    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create OTP for verification
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    // Create user
    const user = new User({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      otp,
      otpExpires,
      joinedDate: new Date(),
      gameStats: {
        totalGamesPlayed: 0,
        totalPlaytime: 0,
        gamesHistory: [],
        achievements: []
      }
    });

    await user.save();

    // Send verification email if email credentials are available
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          }
        });

        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: email,
          subject: 'Verify Your Account',
          html: `
            <h2>Welcome to Sanjayraj's Portfolio!</h2>
            <p>Your verification code is: <strong>${otp}</strong></p>
            <p>This code will expire in 30 minutes.</p>
          `
        });
      } catch (emailError) {
        console.error('Email sending error:', emailError);
        // Continue even if email fails
      }
    }

    res.status(201).json({ 
      success: true,
      message: 'Registration successful! Please check your email for verification code.',
      email: email
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during registration' 
    });
  }
};

// Handle Send OTP
const handleSendOTP = async (req, res) => {
  try {
    await connectDB();

    const { email, type } = req.body;

    // Validation
    if (!email || !type) {
      return res.status(400).json({ message: 'Email and type are required' });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    // Update user with new OTP
    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    // Send OTP email if email credentials are available
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          }
        });

        let subject, html;
        if (type === 'verification') {
          subject = 'Verify Your Account';
          html = `
            <h2>Account Verification</h2>
            <p>Your verification code is: <strong>${otp}</strong></p>
            <p>This code will expire in 30 minutes.</p>
          `;
        } else if (type === 'password-reset') {
          subject = 'Password Reset Request';
          html = `
            <h2>Password Reset</h2>
            <p>Your password reset code is: <strong>${otp}</strong></p>
            <p>This code will expire in 30 minutes.</p>
            <p>If you didn't request this, please ignore this email.</p>
          `;
        }

        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: email,
          subject,
          html
        });
      } catch (emailError) {
        console.error('Email sending error:', emailError);
        return res.status(500).json({ message: 'Failed to send email' });
      }
    } else {
      console.log('Email credentials not available, skipping email send');
    }

    res.status(200).json({ 
      success: true,
      message: 'OTP sent successfully',
      email: email
    });

  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while sending OTP' 
    });
  }
};

// Handle Verify OTP
const handleVerifyOTP = async (req, res) => {
  try {
    await connectDB();

    const { email, otp, type, userData } = req.body;

    // Validation
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    // Find user
    const user = await User.findOne({ 
      email: email.toLowerCase(),
      otp: otp,
      otpExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Handle different verification types
    if (type === 'registration') {
      // For new user registration
      if (!userData || !userData.name || !userData.password) {
        return res.status(400).json({ message: 'Name and password are required for registration' });
      }

      // Validate password
      const passwordValidation = validatePassword(userData.password);
      if (!passwordValidation.isValid) {
        return res.status(400).json({ message: passwordValidation.message });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);

      // Update user
      user.name = userData.name;
      user.password = hashedPassword;
      user.isVerified = true;
      user.otp = null;
      user.otpExpires = null;
      await user.save();

      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: user._id.toString(),
          email: user.email,
          name: user.name
        },
        process.env.JWT_SECRET || 'fallback-jwt-secret-for-development',
        { expiresIn: '7d' }
      );

      return res.status(200).json({
        success: true,
        message: 'Registration completed successfully',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          joinedDate: user.joinedDate
        },
        token
      });
    } 
    else if (type === 'verification') {
      // For existing user verification
      user.isVerified = true;
      user.otp = null;
      user.otpExpires = null;
      await user.save();

      return res.status(200).json({
        success: true,
        message: 'Email verified successfully'
      });
    } 
    else if (type === 'password-reset') {
      // For password reset
      if (!userData || !userData.newPassword) {
        return res.status(400).json({ message: 'New password is required' });
      }

      // Validate password
      const passwordValidation = validatePassword(userData.newPassword);
      if (!passwordValidation.isValid) {
        return res.status(400).json({ message: passwordValidation.message });
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.newPassword, salt);

      // Update user
      user.password = hashedPassword;
      user.otp = null;
      user.otpExpires = null;
      await user.save();

      return res.status(200).json({
        success: true,
        message: 'Password reset successfully'
      });
    }
    else {
      return res.status(400).json({ message: 'Invalid verification type' });
    }

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during verification' 
    });
  }
};

// Password validation helper
const validatePassword = (password) => {
  if (password.length < 6) {
    return { isValid: false, message: 'Password must be at least 6 characters long' };
  }
  return { isValid: true };
};

// Main handler
export default async function handler(req, res) {
  console.log('🔄 Auth API handler called:', {
    method: req.method,
    url: req.url,
    query: req.query,
    headers: {
      origin: req.headers.origin,
      'content-type': req.headers['content-type']
    },
    timestamp: new Date().toISOString()
  });

  // Set CORS headers
  setCorsHeaders(req, res);
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✅ Handling OPTIONS request');
    res.status(200).end();
    return;
  }

  // Get the endpoint from the query
  const { endpoint } = req.query;
  
  console.log('🔍 Requested endpoint:', endpoint);

  // If no endpoint is specified, return API info
  if (!endpoint) {
    console.log('ℹ️ No endpoint specified, returning API info');
    return res.status(200).json({
      success: true,
      message: 'Auth API root',
      endpoints: ['google', 'login', 'register', 'send-otp', 'verify-otp'],
      timestamp: new Date().toISOString()
    });
  }

  // Route to the appropriate handler based on the endpoint
  switch (endpoint) {
    case 'google':
      console.log('✅ Routing to Google auth handler');
      return handleGoogleAuth(req, res);
    case 'login':
      console.log('✅ Routing to login handler');
      return handleLogin(req, res);
    case 'register':
      console.log('✅ Routing to register handler');
      return handleRegister(req, res);
    case 'send-otp':
      console.log('✅ Routing to send-otp handler');
      return handleSendOTP(req, res);
    case 'verify-otp':
      console.log('✅ Routing to verify-otp handler');
      return handleVerifyOTP(req, res);
    default:
      console.log('❌ Endpoint not found:', endpoint);
      return res.status(404).json({ 
        success: false,
        message: `Endpoint not found: ${endpoint}` 
      });
  }
}