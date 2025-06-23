const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'Access denied. No token provided.' 
            });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('Decoded token:', decoded);
            
            const user = await User.findById(decoded.id).select('-password');
            
            if (!user) {
                console.log('User not found for ID:', decoded.id);
                return res.status(401).json({ 
                    success: false, 
                    message: 'User not found. Token is not valid.' 
                });
            }
            
            // Add user info to request object
            req.user = user;
            
            // Add username property for compatibility with GameScore model
            if (!req.user.username && req.user.name) {
                req.user.username = req.user.name;
            }
            
            next();
        } catch (jwtError) {
            console.error('JWT verification error:', jwtError);
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid token format or signature.' 
            });
        }
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({ 
            success: false, 
            message: 'Token is not valid.' 
        });
    }
};

const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '30d'
    });
};

module.exports = { auth, generateToken };