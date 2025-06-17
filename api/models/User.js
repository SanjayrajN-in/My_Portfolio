const mongoose = require('mongoose');

const gameHistorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  score: { type: String, default: 'N/A' },
  duration: { type: Number, default: 0 }, // in minutes
  date: { type: Date, default: Date.now }
});

const gameStatsSchema = new mongoose.Schema({
  totalGamesPlayed: { type: Number, default: 0 },
  totalPlaytime: { type: Number, default: 0 }, // in minutes
  gamesHistory: [gameHistorySchema],
  achievements: [{ type: String }] // Array of achievement IDs
});

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  avatar: {
    type: String,
    default: 'images/default-avatar.svg'
  },
  gameStats: {
    type: gameStatsSchema,
    default: () => ({})
  },
  joinedDate: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Add index for email lookups
userSchema.index({ email: 1 });

module.exports = mongoose.model('User', userSchema);