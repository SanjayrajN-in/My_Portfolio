const connectDB = require('../config/database');
const User = require('../models/User');

export default async function handler(req, res) {
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

    const { userId, gameData } = req.body;

    // Validation
    if (!userId || !gameData) {
      return res.status(400).json({ message: 'User ID and game data are required' });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update game statistics
    user.gameStats.totalGamesPlayed += 1;
    user.gameStats.totalPlaytime += gameData.duration || 0;
    
    // Add to game history
    user.gameStats.gamesHistory.push({
      name: gameData.name,
      score: gameData.score || 'N/A',
      duration: gameData.duration || 0,
      date: new Date()
    });

    // Check and award achievements
    const achievements = [];
    
    // First game achievement
    if (user.gameStats.totalGamesPlayed === 1) {
      achievements.push('first_game');
    }
    
    // Game master achievement (10 games)
    if (user.gameStats.totalGamesPlayed >= 10) {
      achievements.push('game_master');
    }
    
    // Time waster achievement (60 minutes)
    if (user.gameStats.totalPlaytime >= 60) {
      achievements.push('time_waster');
    }
    
    // Dedication achievement (300 minutes)
    if (user.gameStats.totalPlaytime >= 300) {
      achievements.push('dedication');
    }
    
    // High scorer achievement (if score is provided and high)
    if (gameData.score && parseInt(gameData.score) > 1000) {
      achievements.push('high_scorer');
    }
    
    // Add new achievements
    achievements.forEach(achievement => {
      if (!user.gameStats.achievements.includes(achievement)) {
        user.gameStats.achievements.push(achievement);
      }
    });

    await user.save();

    res.status(200).json({ 
      message: 'Game statistics updated successfully',
      gameStats: user.gameStats,
      newAchievements: achievements.filter(a => !user.gameStats.achievements.includes(a))
    });

  } catch (error) {
    console.error('Update game stats error:', error);
    res.status(500).json({ message: 'Server error during game stats update' });
  }
}