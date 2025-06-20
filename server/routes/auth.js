const express = require('express');
const rateLimit = require('express-rate-limit');
const validator = require('validator');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const { auth, generateToken } = require('../middleware/auth');
const emailService = require('../utils/emailService');

// Initialize Google OAuth client
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const router = express.Router();

// Rate limiting for auth routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: { 
        success: false, 
        message: 'Too many attempts. Please try again later.' 
    },
    standardHeaders: true,
    legacyHeaders: false
});

const otpLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 2, // 2 OTP requests per minute
    message: { 
        success: false, 
        message: 'Too many OTP requests. Please wait before requesting again.' 
    }
});

// Password validation function
const validatePassword = (password) => {
    const errors = [];
    
    if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
    }
    if (!/(?=.*[a-z])/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }
    if (!/(?=.*[A-Z])/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }
    if (!/(?=.*\d)/.test(password)) {
        errors.push('Password must contain at least one number');
    }
    if (!/(?=.*[@$!%*?&])/.test(password)) {
        errors.push('Password must contain at least one special character (@$!%*?&)');
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
};

// @route   POST /api/auth/send-otp
// @desc    Send OTP for email verification or password reset
// @access  Public
router.post('/send-otp', otpLimiter, async (req, res) => {
    try {
        const { email, type } = req.body;

        if (!email || !validator.isEmail(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address'
            });
        }

        if (!type || !['register', 'forgot-password', 'login_verification'].includes(type)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP type'
            });
        }

        const user = await User.findOne({ email: email.toLowerCase() });

        if (type === 'register') {
            if (user && user.isEmailVerified) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already registered. Please login instead.',
                    shouldLogin: true
                });
            }
        } else if (type === 'forgot-password') {
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'No account found with this email address'
                });
            }
        } else if (type === 'login_verification') {
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'No account found with this email address'
                });
            }
            if (user.isEmailVerified) {
                return res.status(400).json({
                    success: false,
                    message: 'Account is already verified. Please try logging in normally.'
                });
            }
        }

        // Generate and send OTP
        let otpCode;
        if (type === 'register') {
            if (user) {
                // User exists but not verified, resend verification OTP
                otpCode = user.setEmailVerificationOTP();
                await user.save();
            } else {
                // Create temporary user for OTP verification
                const tempUser = new User({
                    email: email.toLowerCase(),
                    name: 'Temporary', // Will be updated on verification
                    password: 'TempPass123!' // Will be updated on verification - meets validation requirements
                });
                otpCode = tempUser.setEmailVerificationOTP();
                await tempUser.save();
            }
        } else if (type === 'forgot-password') {
            otpCode = user.setPasswordResetOTP();
            await user.save();
        } else if (type === 'login_verification') {
            otpCode = user.setEmailVerificationOTP();
            await user.save();
        }

        const emailResult = await emailService.sendOTP(email, otpCode, type === 'register' ? 'verification' : 'reset');

        if (!emailResult.success) {
            return res.status(500).json({
                success: false,
                message: 'Failed to send OTP. Please try again.'
            });
        }

        res.json({
            success: true,
            message: 'OTP sent successfully to your email address'
        });

    } catch (error) {
        console.error('Send OTP error:', error);
        console.error('Error stack:', error.stack);
        console.error('Error details:', {
            message: error.message,
            name: error.name,
            email: req.body?.email,
            type: req.body?.type
        });
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.'
        });
    }
});

// @route   POST /api/auth/register
// @desc    Register user with OTP verification
// @access  Public
router.post('/register', authLimiter, async (req, res) => {
    try {
        const { name, email, password, confirmPassword, otp } = req.body;

        // Validation
        if (!name || !email || !password || !confirmPassword || !otp) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        if (!validator.isEmail(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address'
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Passwords do not match'
            });
        }

        const passwordValidation = validatePassword(password);
        if (!passwordValidation.isValid) {
            return res.status(400).json({
                success: false,
                message: 'Password requirements not met',
                errors: passwordValidation.errors
            });
        }

        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Please request OTP first'
            });
        }

        if (user.isEmailVerified) {
            return res.status(400).json({
                success: false,
                message: 'Email already verified. Please login.'
            });
        }

        if (!user.verifyEmailOTP(otp)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired OTP'
            });
        }

        // Update user with actual registration data
        user.name = name.trim();
        user.password = password;
        user.isEmailVerified = true;
        user.emailVerificationOTP = undefined;
        await user.save();

        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            message: 'Registration successful!',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                joinedDate: user.joinedDate
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.'
        });
    }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', authLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        if (!validator.isEmail(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address'
            });
        }

        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        if (!user.isEmailVerified) {
            return res.status(401).json({
                success: false,
                message: 'Account not verified. Please check your email for verification code.',
                requiresVerification: true
            });
        }

        if (user.isLocked()) {
            return res.status(423).json({
                success: false,
                message: 'Account temporarily locked due to too many failed login attempts'
            });
        }

        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            await user.incLoginAttempts();
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Reset login attempts on successful login
        if (user.loginAttempts > 0) {
            await user.resetLoginAttempts();
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        const token = generateToken(user._id);

        res.json({
            success: true,
            message: 'Login successful!',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                joinedDate: user.joinedDate,
                gameStats: user.gameStats
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.'
        });
    }
});

// @route   GET /api/auth/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
    try {
        res.json({
            success: true,
            user: {
                id: req.user._id,
                name: req.user.name,
                email: req.user.email,
                avatar: req.user.avatar,
                joinedDate: req.user.joinedDate,
                gameStats: req.user.gameStats,
                lastLogin: req.user.lastLogin
            }
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   POST /api/auth/logout
// @desc    Logout user (invalidate token on client side)
// @access  Private
router.post('/logout', auth, async (req, res) => {
    try {
        // In a real production app, you might want to blacklist the token
        // For now, we just send success response and client will clear the token
        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   POST /api/auth/cleanup-unverified
// @desc    Remove unverified accounts when user exits registration
// @access  Public
router.post('/cleanup-unverified', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email || !validator.isEmail(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address'
            });
        }

        const user = await User.findOne({ email: email.toLowerCase() });

        if (user && !user.isEmailVerified) {
            // Only delete if the account is unverified and was created recently (within last hour)
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
            if (user.createdAt > oneHourAgo) {
                await User.deleteOne({ _id: user._id });
                console.log(`Cleaned up unverified account: ${email}`);
            }
        }

        res.json({
            success: true,
            message: 'Cleanup completed'
        });

    } catch (error) {
        console.error('Cleanup error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP for password reset or other purposes
// @access  Public
router.post('/verify-otp', authLimiter, async (req, res) => {
    try {
        const { email, otp, type } = req.body;

        if (!email || !otp || !type) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email, OTP, and type'
            });
        }

        if (!validator.isEmail(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address'
            });
        }

        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        let isValidOTP = false;
        
        if (type === 'forgot-password') {
            isValidOTP = user.verifyPasswordResetOTP(otp);
        } else if (type === 'register') {
            isValidOTP = user.verifyEmailOTP(otp);
        } else if (type === 'login_verification') {
            isValidOTP = user.verifyEmailOTP(otp);
        }

        if (!isValidOTP) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired OTP'
            });
        }

        // Handle different verification types
        if (type === 'register') {
            // Update user data from request
            const { userData } = req.body;
            if (userData) {
                user.name = userData.name;
                if (userData.password) {
                    user.password = userData.password;
                }
            }
            
            // Mark email as verified
            user.isEmailVerified = true;
            user.emailVerificationOTP = undefined;
            user.emailVerificationOTPExpires = undefined;
            await user.save();

            // Generate JWT token
            const token = generateToken(user._id);

            res.json({
                success: true,
                message: 'Registration successful! Welcome to the platform.',
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    avatar: user.avatar,
                    isEmailVerified: user.isEmailVerified,
                    gameStats: user.gameStats
                }
            });
        } else if (type === 'login_verification') {
            // Mark email as verified (in case it wasn't)
            user.isEmailVerified = true;
            user.emailVerificationOTP = undefined;
            user.emailVerificationOTPExpires = undefined;
            
            // Update last login
            user.lastLogin = new Date();
            await user.save();

            // Generate JWT token
            const token = generateToken(user._id);

            res.json({
                success: true,
                message: 'Login successful! Welcome back.',
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    avatar: user.avatar,
                    isEmailVerified: user.isEmailVerified,
                    gameStats: user.gameStats
                }
            });
        } else {
            res.json({
                success: true,
                message: 'OTP verified successfully'
            });
        }

    } catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.'
        });
    }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password with OTP
// @access  Public
router.post('/reset-password', authLimiter, async (req, res) => {
    try {
        const { email, otp, newPassword, confirmPassword } = req.body;

        if (!email || !otp || !newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Passwords do not match'
            });
        }

        const passwordValidation = validatePassword(newPassword);
        if (!passwordValidation.isValid) {
            return res.status(400).json({
                success: false,
                message: 'Password requirements not met',
                errors: passwordValidation.errors
            });
        }

        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user || !user.verifyPasswordResetOTP(otp)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired OTP'
            });
        }

        user.password = newPassword;
        user.passwordResetOTP = undefined;
        await user.save();

        res.json({
            success: true,
            message: 'Password reset successfully'
        });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.'
        });
    }
});

// Google OAuth routes
const { OAuth2Client } = require('google-auth-library');

// @route   GET /api/auth/google/init
// @desc    Get Google Client ID for frontend initialization
// @access  Public
router.get('/google/init', (req, res) => {
    try {
        const clientId = process.env.GOOGLE_CLIENT_ID;
        
        if (!clientId) {
            return res.status(500).json({
                success: false,
                message: 'Google OAuth not configured'
            });
        }

        res.json({
            success: true,
            clientId: clientId
        });
    } catch (error) {
        console.error('Google init error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   POST /api/auth/google/verify
// @desc    Verify Google credential and login/register user
// @access  Public
router.post('/google/verify', async (req, res) => {
    try {
        const { credential } = req.body;

        if (!credential) {
            return res.status(400).json({
                success: false,
                message: 'Google credential is required'
            });
        }

        const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
        
        // Verify the Google credential
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();
        const { email, name, picture, email_verified } = payload;

        if (!email_verified) {
            return res.status(400).json({
                success: false,
                message: 'Google account email is not verified'
            });
        }

        // Check if user exists
        let user = await User.findOne({ email: email.toLowerCase() });

        if (user) {
            // User exists, update last login and Google info
            user.lastLogin = new Date();
            if (!user.avatar && picture) {
                user.avatar = picture;
            }
            if (!user.googleId) {
                user.googleId = payload.sub;
            }
            await user.save();
        } else {
            // Create new user
            user = new User({
                name: name,
                email: email.toLowerCase(),
                avatar: picture,
                googleId: payload.sub,
                isEmailVerified: true, // Google accounts are pre-verified
                password: 'GoogleAuth_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + '!1A'
            });
            await user.save();
        }

        // Generate JWT token
        const token = generateToken(user._id);

        res.json({
            success: true,
            message: user.lastLogin ? 'Welcome back!' : 'Account created successfully!',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                isEmailVerified: user.isEmailVerified,
                gameStats: user.gameStats
            }
        });

    } catch (error) {
        console.error('Google verify error:', error);
        res.status(500).json({
            success: false,
            message: 'Google authentication failed'
        });
    }
});

// @route   GET /api/auth/google/login
// @desc    Google OAuth popup login (fallback)
// @access  Public
router.get('/google/login', (req, res) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/google/callback`;
    
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${clientId}&` +
        `redirect_uri=${redirectUri}&` +
        `response_type=code&` +
        `scope=email profile&` +
        `access_type=offline`;
    
    res.redirect(googleAuthUrl);
});

// @route   GET /api/auth/google/callback
// @desc    Google OAuth callback
// @access  Public
router.get('/google/callback', async (req, res) => {
    try {
        const { code } = req.query;
        
        if (!code) {
            return res.send(`
                <script>
                    window.opener.postMessage({
                        type: 'GOOGLE_LOGIN_ERROR',
                        message: 'Authorization code not received'
                    }, '*');
                    window.close();
                </script>
            `);
        }

        // Exchange code for tokens
        const client = new OAuth2Client(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            `${req.protocol}://${req.get('host')}/api/auth/google/callback`
        );

        const { tokens } = await client.getToken(code);
        client.setCredentials(tokens);

        // Get user info
        const ticket = await client.verifyIdToken({
            idToken: tokens.id_token,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();
        const { email, name, picture, email_verified } = payload;

        if (!email_verified) {
            return res.send(`
                <script>
                    window.opener.postMessage({
                        type: 'GOOGLE_LOGIN_ERROR',
                        message: 'Google account email is not verified'
                    }, '*');
                    window.close();
                </script>
            `);
        }

        // Check if user exists or create new user (same logic as above)
        let user = await User.findOne({ email: email.toLowerCase() });

        if (user) {
            user.lastLogin = new Date();
            if (!user.avatar && picture) {
                user.avatar = picture;
            }
            if (!user.googleId) {
                user.googleId = payload.sub;
            }
            await user.save();
        } else {
            user = new User({
                name: name,
                email: email.toLowerCase(),
                avatar: picture,
                googleId: payload.sub,
                isEmailVerified: true,
                password: 'GoogleAuth_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + '!1A'
            });
            await user.save();
        }

        const token = generateToken(user._id);

        // Send success message to popup
        res.send(`
            <script>
                window.opener.postMessage({
                    type: 'GOOGLE_LOGIN_SUCCESS',
                    user: {
                        id: '${user._id}',
                        name: '${user.name}',
                        email: '${user.email}',
                        avatar: '${user.avatar || ''}',
                        isEmailVerified: ${user.isEmailVerified},
                        gameStats: ${JSON.stringify(user.gameStats)}
                    },
                    token: '${token}'
                }, '*');
                window.close();
            </script>
        `);

    } catch (error) {
        console.error('Google callback error:', error);
        res.send(`
            <script>
                window.opener.postMessage({
                    type: 'GOOGLE_LOGIN_ERROR',
                    message: 'Google authentication failed'
                }, '*');
                window.close();
            </script>
        `);
    }
});

// @route   POST /api/auth/verify-login
// @desc    Verify login with OTP for unverified accounts
// @access  Public
router.post('/verify-login', authLimiter, async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and OTP'
            });
        }

        if (!validator.isEmail(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address'
            });
        }

        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (!user.verifyEmailOTP(otp)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired OTP'
            });
        }

        // Mark email as verified
        user.isEmailVerified = true;
        user.emailVerificationOTP = undefined;
        user.emailVerificationOTPExpires = undefined;
        user.lastLogin = new Date();
        await user.save();

        const token = generateToken(user._id);

        res.json({
            success: true,
            message: 'Login successful!',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                joinedDate: user.joinedDate,
                gameStats: user.gameStats
            }
        });

    } catch (error) {
        console.error('Verify login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.'
        });
    }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password with OTP
// @access  Public
router.post('/reset-password', authLimiter, async (req, res) => {
    try {
        const { email, otp, password } = req.body;

        if (!email || !otp || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email, OTP, and new password'
            });
        }

        if (!validator.isEmail(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address'
            });
        }

        const passwordValidation = validatePassword(password);
        if (!passwordValidation.isValid) {
            return res.status(400).json({
                success: false,
                message: 'Password requirements not met',
                errors: passwordValidation.errors
            });
        }

        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (!user.verifyPasswordResetOTP(otp)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset code'
            });
        }

        // Update password
        user.password = password;
        user.passwordResetOTP = undefined;
        user.passwordResetOTPExpires = undefined;
        
        // Reset login attempts
        user.loginAttempts = 0;
        user.lockUntil = undefined;
        
        await user.save();

        res.json({
            success: true,
            message: 'Password reset successful! You can now login with your new password.'
        });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.'
        });
    }
});

// @route   POST /api/auth/google-login
// @desc    Login with Google credential
// @access  Public
router.post('/google-login', async (req, res) => {
    try {
        const { credential } = req.body;

        if (!credential) {
            return res.status(400).json({
                success: false,
                message: 'Google credential is required'
            });
        }

        // Verify Google token
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();
        const { sub: googleId, email, name, picture } = payload;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email not provided by Google'
            });
        }

        let user = await User.findOne({ 
            $or: [
                { email: email.toLowerCase() },
                { googleId: googleId }
            ]
        });

        if (user) {
            // Update user info if needed
            if (!user.googleId) {
                user.googleId = googleId;
            }
            if (!user.avatar && picture) {
                user.avatar = picture;
            }
            user.lastLogin = new Date();
            await user.save();
        } else {
            return res.status(404).json({
                success: false,
                message: 'No account found. Please register first.'
            });
        }

        const token = generateToken(user._id);

        res.json({
            success: true,
            message: 'Login successful!',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                joinedDate: user.joinedDate,
                gameStats: user.gameStats
            }
        });

    } catch (error) {
        console.error('Google login error:', error);
        res.status(500).json({
            success: false,
            message: 'Google authentication failed'
        });
    }
});

// @route   POST /api/auth/google-register
// @desc    Register with Google credential
// @access  Public
router.post('/google-register', async (req, res) => {
    try {
        const { credential } = req.body;

        if (!credential) {
            return res.status(400).json({
                success: false,
                message: 'Google credential is required'
            });
        }

        // Verify Google token
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();
        const { sub: googleId, email, name, picture } = payload;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email not provided by Google'
            });
        }

        // Check if user already exists
        let user = await User.findOne({ 
            $or: [
                { email: email.toLowerCase() },
                { googleId: googleId }
            ]
        });

        if (user) {
            return res.status(400).json({
                success: false,
                message: 'Account already exists. Please login instead.'
            });
        }

        // Create new user
        user = new User({
            name: name,
            email: email.toLowerCase(),
            avatar: picture,
            googleId: googleId,
            isEmailVerified: true,
            password: 'GoogleAuth_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + '!1A'
        });

        await user.save();

        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            message: 'Registration successful!',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                joinedDate: user.joinedDate,
                gameStats: user.gameStats
            }
        });

    } catch (error) {
        console.error('Google register error:', error);
        res.status(500).json({
            success: false,
            message: 'Google registration failed'
        });
    }
});

// @route   GET /api/auth/google-config
// @desc    Get Google OAuth client configuration
// @access  Public
router.get('/google-config', (req, res) => {
    res.json({
        success: true,
        clientId: process.env.GOOGLE_CLIENT_ID
    });
});

// @route   POST /api/auth/change-password
// @desc    Change user password
// @access  Private
router.post('/change-password', auth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Please provide current and new password'
            });
        }

        const passwordValidation = validatePassword(newPassword);
        if (!passwordValidation.isValid) {
            return res.status(400).json({
                success: false,
                message: 'New password requirements not met',
                errors: passwordValidation.errors
            });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check current password
        const isCurrentPasswordValid = await user.comparePassword(currentPassword);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        res.json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.'
        });
    }
});

module.exports = router;