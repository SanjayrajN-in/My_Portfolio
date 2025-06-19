// Consolidated Contact and User API Handler
import connectDB from './config/database';
import Contact from './models/Contact';
import User from './models/User';
import nodemailer from 'nodemailer';

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
};

// Handle Contact Form Submission
const handleContactSubmit = async (req, res) => {
  try {
    await connectDB();

    // Get form data
    const { name, email, subject, message } = req.body;

    // Validation
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Create new contact entry
    const contact = new Contact({
      name,
      email,
      subject,
      message,
      ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    });

    // Save to database
    await contact.save();

    // Send email notification (optional)
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          }
        });

        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: 'sanjayrajnblr@gmail.com', // Your email
          subject: `Portfolio Contact: ${subject}`,
          html: `
            <h3>New Contact Form Submission</h3>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <p><strong>Message:</strong> ${message}</p>
            <p><strong>IP Address:</strong> ${contact.ipAddress}</p>
            <p><strong>User Agent:</strong> ${contact.userAgent}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
          `
        };

        await transporter.sendMail(mailOptions);
      } catch (emailError) {
        console.error('Email sending error:', emailError);
        // Continue even if email fails
      }
    }

    res.status(201).json({ 
      success: true,
      message: 'Your message has been sent successfully!' 
    });

  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while submitting your message' 
    });
  }
};

// Handle Update Game Stats
const handleUpdateGameStats = async (req, res) => {
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
      success: true,
      message: 'Game statistics updated successfully',
      gameStats: user.gameStats,
      newAchievements: achievements.filter(a => !user.gameStats.achievements.includes(a))
    });

  } catch (error) {
    console.error('Update game stats error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during game stats update' 
    });
  }
};

// Main handler
export default async function handler(req, res) {
  // Set CORS headers
  setCorsHeaders(req, res);
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Get the endpoint from the query
  const { endpoint } = req.query;

  // Route to the appropriate handler based on the endpoint
  switch (endpoint) {
    case 'submit':
      return handleContactSubmit(req, res);
    case 'update-game-stats':
      return handleUpdateGameStats(req, res);
    default:
      return res.status(404).json({ 
        success: false,
        message: 'Endpoint not found' 
      });
  }
}