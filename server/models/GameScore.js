const mongoose = require('mongoose');

const gameScoreSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    username: {
        type: String,
        required: true
    },
    gameName: {
        type: String,
        required: true,
        enum: ['snake', 'brickBreaker', 'memoryMatch', 'tictactoe']
    },
    score: {
        type: Number,
        required: true
    },
    level: {
        type: Number,
        default: 1
    },
    timeElapsed: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Create indexes for efficient querying
gameScoreSchema.index({ gameName: 1, score: -1 });
gameScoreSchema.index({ userId: 1, gameName: 1 }, { unique: true }); // Ensure one record per user per game

const GameScore = mongoose.model('GameScore', gameScoreSchema);

module.exports = GameScore;