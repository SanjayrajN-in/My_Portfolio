const express = require('express');
const router = express.Router();
const GameScore = require('../models/GameScore');
const { auth } = require('../middleware/auth');

// Submit a new score
router.post('/submit', auth, async (req, res) => {
    try {
        console.log('Score submission request received:', req.body);
        console.log('User from auth middleware:', req.user ? req.user.id : 'No user');
        
        const { gameName, score, level, timeElapsed } = req.body;
        
        if (!gameName || score === undefined) {
            console.log('Missing required fields:', { gameName, score });
            return res.status(400).json({ 
                success: false,
                message: 'Game name and score are required' 
            });
        }
        
        // Validate game name against allowed values
        const allowedGames = ['snake', 'brickBreaker', 'memoryMatch', 'tictactoe'];
        if (!allowedGames.includes(gameName)) {
            console.log('Invalid game name:', gameName);
            return res.status(400).json({ 
                success: false,
                message: `Invalid game name. Allowed values: ${allowedGames.join(', ')}` 
            });
        }
        
        try {
            // Check if username exists, if not use email or a default value
            const username = req.user.username || req.user.name || req.user.email?.split('@')[0] || 'Player' + req.user.id.substring(0, 6);
            console.log('Using username:', username);
            
            // Convert score values to numbers
            const numericScore = Number(score);
            const numericLevel = Number(level || 1);
            const numericTimeElapsed = Number(timeElapsed || 0);
            
            // First, check if user has an existing record for this game
            const existingRecord = await GameScore.findOne({
                userId: req.user.id,
                gameName: gameName
            });
            
            let result;
            let isNewHighScore = false;
            
            if (!existingRecord) {
                // No existing record, create new one
                console.log('Creating new score record');
                result = new GameScore({
                    userId: req.user.id,
                    username: username,
                    gameName: gameName,
                    score: numericScore,
                    level: numericLevel,
                    timeElapsed: numericTimeElapsed
                });
                await result.save();
                isNewHighScore = true;
            } else if (numericScore > existingRecord.score) {
                // New score is higher, update the existing record
                console.log('Updating existing score record with higher score');
                existingRecord.score = numericScore;
                existingRecord.level = numericLevel;
                existingRecord.timeElapsed = numericTimeElapsed;
                existingRecord.username = username; // Update username in case it changed
                result = await existingRecord.save();
                isNewHighScore = true;
            } else {
                // Score is not higher, don't update
                console.log('Score not higher than existing, no update needed');
                result = existingRecord;
                isNewHighScore = false;
            }
            
            console.log(`Score processing complete for user ${req.user.id}, game ${gameName}, score ${numericScore}, isNewHighScore: ${isNewHighScore}`);
            
            return res.status(200).json({ 
                success: true,
                message: isNewHighScore ? 'New high score saved successfully!' : 'Score submitted but not higher than existing record',
                score: result,
                isNewHighScore: isNewHighScore
            });
            
        } catch (dbError) {
            console.error('Database error when saving score:', dbError);
            return res.status(500).json({ 
                success: false,
                message: 'Database error when saving score',
                error: dbError.message
            });
        }
    } catch (error) {
        console.error('Error saving score:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// Get top scores for a game
router.get('/rankings/:gameName', async (req, res) => {
    try {
        const { gameName } = req.params;
        
        console.log(`Fetching rankings for ${gameName}`);
        
        // Validate game name
        const allowedGames = ['snake', 'brickBreaker', 'memoryMatch', 'tictactoe'];
        if (!allowedGames.includes(gameName)) {
            console.log('Invalid game name for rankings:', gameName);
            return res.status(400).json({ 
                success: false,
                message: `Invalid game name. Allowed values: ${allowedGames.join(', ')}` 
            });
        }
        
        // Use aggregation to get the highest score for each user with correct associated data
        const topScores = await GameScore.aggregate([
            // Match documents for the specified game
            { $match: { gameName: gameName } },
            
            // Sort by score descending to get highest scores first
            { $sort: { score: -1, createdAt: -1 } },
            
            // Group by userId and get the document with the highest score for each user
            { 
                $group: {
                    _id: "$userId",
                    username: { $first: "$username" },
                    score: { $first: "$score" },
                    level: { $first: "$level" },
                    timeElapsed: { $first: "$timeElapsed" },
                    createdAt: { $first: "$createdAt" }
                }
            },
            
            // Sort by score in descending order again
            { $sort: { score: -1 } },
            
            // Limit to top 10 scores (increased from 3 for better rankings)
            { $limit: 10 },
            
            // Project the fields we want to return
            {
                $project: {
                    _id: 0,
                    username: 1,
                    score: 1,
                    level: 1,
                    timeElapsed: 1,
                    createdAt: 1
                }
            }
        ]);
        
        console.log(`Found ${topScores.length} top scores for ${gameName}:`, topScores.slice(0, 3));
        
        // Ensure we always return an array
        res.json(Array.isArray(topScores) ? topScores : []);
    } catch (error) {
        console.error('Error fetching rankings:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// Get user's rank for a game
router.get('/user-rank/:gameName', auth, async (req, res) => {
    try {
        const { gameName } = req.params;
        
        console.log(`Fetching user rank for user ${req.user.id} in game ${gameName}`);
        
        // Get user's highest score
        const userScore = await GameScore.findOne({
            userId: req.user.id,
            gameName
        }).sort({ score: -1 });
        
        if (!userScore) {
            console.log(`No score found for user ${req.user.id} in game ${gameName}`);
            return res.json({ rank: null, score: 0 });
        }
        
        console.log(`Found user score: ${userScore.score} for user ${req.user.id} in game ${gameName}`);
        
        // Use aggregation to get the highest score for each user, then count how many are higher
        const higherScoreUsers = await GameScore.aggregate([
            // Match documents for the specified game
            { $match: { gameName: gameName } },
            
            // Group by userId and get the highest score for each user
            { 
                $group: {
                    _id: "$userId",
                    maxScore: { $max: "$score" }
                }
            },
            
            // Match only users with scores higher than current user's score
            { $match: { maxScore: { $gt: userScore.score } } },
            
            // Count the results
            { $count: "higherScoreCount" }
        ]);
        
        // Get the count of users with higher scores
        const higherCount = higherScoreUsers.length > 0 ? higherScoreUsers[0].higherScoreCount : 0;
        
        // User's rank is the number of users with higher scores + 1
        const rank = higherCount + 1;
        
        console.log(`User ${req.user.id} rank for ${gameName}: ${rank} (score: ${userScore.score}, higher users: ${higherCount})`);
        
        res.json({
            rank,
            score: userScore.score,
            level: userScore.level,
            timeElapsed: userScore.timeElapsed
        });
    } catch (error) {
        console.error('Error fetching user rank:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;