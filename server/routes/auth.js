const express = require('express');
const rateLimit = require('express-rate-limit');
const validator = require('validator');
const User = require('../models/User');
const { auth, generateToken } = require('../middleware/auth');
const emailService = require('../utils/emailService');

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

        if (!type || !['register', 'forgot-password'].includes(type)) {
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
                    password: 'temporary' // Will be updated on verification
                });
                otpCode = tempUser.setEmailVerificationOTP();
                await tempUser.save();
            }
        } else {
            otpCode = user.setPasswordResetOTP();
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
                message: 'Please verify your email first'
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
        }

        if (!isValidOTP) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired OTP'
            });
        }

        res.json({
            success: true,
            message: 'OTP verified successfully'
        });

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

module.exports = router;