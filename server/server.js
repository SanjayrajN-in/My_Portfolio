const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const emailService = require('./utils/emailService');

const app = express();

// Security middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate limiting
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.'
    }
});

app.use(generalLimiter);

// CORS configuration
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        // Allow localhost and your domain
        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:8080',
            'http://127.0.0.1:5500',
            'http://localhost:5500',
            // Add your production domain here
        ];
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log('✅ Connected to MongoDB');
    // Verify email service configuration
    emailService.verifyEmailConfiguration();
})
.catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// Routes
app.use('/api/auth', authRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(e => e.message);
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: errors
        });
    }
    
    if (err.code === 11000) {
        return res.status(400).json({
            success: false,
            message: 'Email already exists'
        });
    }
    
    res.status(500).json({
        success: false,
        message: 'Server error'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found'
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log('🚀 Server running on port', PORT);
    console.log('📧 Email service:', process.env.EMAIL_USER ? 'Configured' : 'Not configured');
    console.log('🔒 JWT Secret:', process.env.JWT_SECRET ? 'Set' : 'Not set');
});

module.exports = app;