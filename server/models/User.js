const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters'],
        maxlength: [50, 'Name cannot exceed 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters'],
        validate: {
            validator: function(password) {
                // Password must contain at least one uppercase, one lowercase, one number, and one special character
                return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(password);
            },
            message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
        }
    },
    avatar: {
        type: String,
        default: null
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    emailVerificationOTP: {
        code: String,
        expiresAt: Date
    },
    passwordResetOTP: {
        code: String,
        expiresAt: Date
    },
    loginAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: Date,
    lastLogin: Date,
    joinedDate: {
        type: Date,
        default: Date.now
    },
    gameStats: {
        gamesPlayed: { type: Number, default: 0 },
        totalScore: { type: Number, default: 0 },
        achievements: [String]
    }
}, {
    timestamps: true
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Method to check if account is locked
userSchema.methods.isLocked = function() {
    return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Method to increment login attempts
userSchema.methods.incLoginAttempts = function() {
    // If we have a previous lock that has expired, restart at 1
    if (this.lockUntil && this.lockUntil < Date.now()) {
        return this.updateOne({
            $unset: { lockUntil: 1 },
            $set: { loginAttempts: 1 }
        });
    }
    
    const updates = { $inc: { loginAttempts: 1 } };
    
    // Lock account after 5 failed attempts for 2 hours
    if (this.loginAttempts + 1 >= 5 && !this.isLocked()) {
        updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
    }
    
    return this.updateOne(updates);
};

// Method to reset login attempts
userSchema.methods.resetLoginAttempts = function() {
    return this.updateOne({
        $unset: { loginAttempts: 1, lockUntil: 1 }
    });
};

// Generate OTP
userSchema.methods.generateOTP = function() {
    return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
};

// Set email verification OTP
userSchema.methods.setEmailVerificationOTP = function() {
    const otp = this.generateOTP();
    this.emailVerificationOTP = {
        code: otp,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    };
    return otp;
};

// Set password reset OTP
userSchema.methods.setPasswordResetOTP = function() {
    const otp = this.generateOTP();
    this.passwordResetOTP = {
        code: otp,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    };
    return otp;
};

// Verify email verification OTP
userSchema.methods.verifyEmailOTP = function(otp) {
    if (!this.emailVerificationOTP || 
        !this.emailVerificationOTP.code || 
        this.emailVerificationOTP.expiresAt < Date.now()) {
        return false;
    }
    
    return this.emailVerificationOTP.code === otp;
};

// Verify password reset OTP
userSchema.methods.verifyPasswordResetOTP = function(otp) {
    if (!this.passwordResetOTP || 
        !this.passwordResetOTP.code || 
        this.passwordResetOTP.expiresAt < Date.now()) {
        return false;
    }
    
    return this.passwordResetOTP.code === otp;
};

module.exports = mongoose.model('User', userSchema);