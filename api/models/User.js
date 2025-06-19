import mongoose from 'mongoose';

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
    required: function() {
      // Password is only required if user doesn't have googleId
      return !this.googleId;
    },
    minlength: 6
  },
  googleId: {
    type: String,
    sparse: true, // Allow multiple null values but unique non-null values
    unique: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  otp: {
    type: String,
    default: null
  },
  otpExpires: {
    type: Date,
    default: null
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

// Check if the model already exists to prevent model overwrite errors in serverless environment
const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;