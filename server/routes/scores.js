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
            // Check if this is a higher score than the user's previous best
            const existingScore = await GameScore.findOne({
                userId: req.user.id,
                gameName
            }).sort({ score: -1 });
            
            console.log('Existing score:', existingScore);
            
            // Only save if it's a higher score or no previous score exists
            if (!existingScore || score > existingScore.score) {
                // Log the user object to see what fields are available
                console.log('User object from auth middleware:', req.user);
                
                // Check if username exists, if not use email or a default value
                const username = req.user.username || req.user.name || req.user.email?.split('@')[0] || 'Player' + req.user.id.substring(0, 6);
                console.log('Using username:', username);
                
                // Convert score values to numbers
                const numericScore = Number(score);
                const numericLevel = Number(level || 1);
                const numericTimeElapsed = Number(timeElapsed || 0);
                
                if (existingScore) {
                    // Update existing record instead of creating a new one
                    console.log('Updating existing score record');
                    
                    existingScore.score = numericScore;
                    existingScore.level = numericLevel;
                    existingScore.timeElapsed = numericTimeElapsed;
                    existingScore.username = username; // Update username in case it changed
                    
                    await existingScore.save();
                    
                    return res.status(200).json({ 
                        success: true,
                        message: 'Score updated successfully', 
                        score: existingScore 
                    });
                } else {
                    // Create a new score record
                    console.log('Creating new score record');
                    
                    const newScore = new GameScore({
                        userId: req.user.id,
                        username: username, // This is required by the GameScore model
                        gameName,
                        score: numericScore,
                        level: numericLevel,
                        timeElapsed: numericTimeElapsed
                    });
                    
                    console.log('Saving new score:', newScore);
                    
                    await newScore.save();
                    return res.status(201).json({ 
                        success: true,
                        message: 'Score saved successfully', 
                        score: newScore 
                    });
                }
            }
            
            return res.status(200).json({ 
                success: true,
                message: 'Score not saved - previous high score is higher',
                existingScore
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
        
        // Use aggregation to get the highest score for each user
        const topScores = await GameScore.aggregate([
            // Match documents for the specified game
            { $match: { gameName: gameName } },
            
            // Group by userId and get the highest score for each user
            { 
                $group: {
                    _id: "$userId",
                    username: { $first: "$username" },
                    score: { $max: "$score" },
                    level: { $first: "$level" },
                    timeElapsed: { $first: "$timeElapsed" },
                    createdAt: { $first: "$createdAt" }
                }
            },
            
            // Sort by score in descending order
            { $sort: { score: -1 } },
            
            // Limit to top 3 scores
            { $limit: 3 },
            
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
        
        console.log(`Found ${topScores.length} top scores for ${gameName}`);
        
        res.json(topScores);
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
        
        // Get user's highest score
        const userScore = await GameScore.findOne({
            userId: req.user.id,
            gameName
        }).sort({ score: -1 });
        
        if (!userScore) {
            return res.json({ rank: null, score: null });
        }
        
        // Count how many scores are higher than the user's score
        const higherScores = await GameScore.countDocuments({
            gameName,
            score: { $gt: userScore.score }
        });
        
        // User's rank is the number of higher scores + 1
        const rank = higherScores + 1;
        
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