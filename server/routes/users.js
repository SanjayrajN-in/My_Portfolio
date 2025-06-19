const express = require('express');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Rate limiting for user operations
const userLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 30, // 30 requests per window
    message: { 
        success: false, 
        message: 'Too many requests. Please try again later.' 
    }
});

// Update game statistics
router.post('/update-game-stats', userLimiter, auth, async (req, res) => {
    try {
        const { userId, gameData } = req.body;
        
        // Make sure user can only update their own stats
        if (req.user.userId !== userId) {
            return res.status(403).json({
                success: false,
                message: 'You can only update your own game statistics'
            });
        }

        // Validate gameData
        if (!gameData || typeof gameData !== 'object') {
            return res.status(400).json({
                success: false,
                message: 'Invalid game data provided'
            });
        }

        // Find user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Update game stats
        const { score, gameName, level, achievements } = gameData;
        
        // Initialize gameStats if it doesn't exist
        if (!user.gameStats) {
            user.gameStats = {
                gamesPlayed: 0,
                totalScore: 0,
                achievements: []
            };
        }

        // Update statistics
        if (score && typeof score === 'number' && score > 0) {
            user.gameStats.totalScore = (user.gameStats.totalScore || 0) + score;
        }

        // Increment games played
        user.gameStats.gamesPlayed = (user.gameStats.gamesPlayed || 0) + 1;

        // Add achievements if provided
        if (achievements && Array.isArray(achievements)) {
            const newAchievements = achievements.filter(ach => 
                !user.gameStats.achievements.includes(ach)
            );
            user.gameStats.achievements.push(...newAchievements);
        }

        // Add game-specific stats if provided
        if (gameName) {
            if (!user.gameStats[gameName]) {
                user.gameStats[gameName] = {
                    played: 0,
                    bestScore: score || 0,
                    lastPlayed: new Date()
                };
            } else {
                user.gameStats[gameName].played = (user.gameStats[gameName].played || 0) + 1;
                if (score && score > (user.gameStats[gameName].bestScore || 0)) {
                    user.gameStats[gameName].bestScore = score;
                }
                user.gameStats[gameName].lastPlayed = new Date();
            }
        }

        // Save user
        await user.save();

        res.json({
            success: true,
            message: 'Game statistics updated successfully',
            gameStats: user.gameStats
        });

    } catch (error) {
        console.error('Update game stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update game statistics'
        });
    }
});

// Get user profile with game stats
router.get('/profile/:userId', userLimiter, auth, async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Users can only view their own profile (for privacy)
        if (req.user.userId !== userId) {
            return res.status(403).json({
                success: false,
                message: 'You can only view your own profile'
            });
        }

        const user = await User.findById(userId).select('-password -emailVerificationOTP -passwordResetOTP');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            user: user
        });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user profile'
        });
    }
});

// Update user profile
router.put('/profile', userLimiter, auth, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { name, avatar } = req.body;

        // Validate input
        if (name && (typeof name !== 'string' || name.trim().length < 2)) {
            return res.status(400).json({
                success: false,
                message: 'Name must be at least 2 characters long'
            });
        }

        // Find and update user
        const updateData = {};
        if (name) updateData.name = name.trim();
        if (avatar) updateData.avatar = avatar;

        const user = await User.findByIdAndUpdate(
            userId, 
            updateData, 
            { new: true, runValidators: true }
        ).select('-password -emailVerificationOTP -passwordResetOTP');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: user
        });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update profile'
        });
    }
});

module.exports = router;