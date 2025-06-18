const connectDB = require('../config/database');
const User = require('../models/User');

module.exports = async (req, res) => {
    try {
        // Connect to database
        await connectDB();
        
        // Get database info
        const connection = require('mongoose').connection;
        const dbName = connection.db.databaseName;
        
        // List all collections in YOUR database
        const collections = await connection.db.listCollections().toArray();
        
        // Count users in your application
        const userCount = await User.countDocuments();
        
        // Get sample user data (without sensitive info)
        const sampleUsers = await User.find({}, { 
            name: 1, 
            email: 1, 
            joinedDate: 1, 
            isVerified: 1,
            googleId: { $exists: true }
        }).limit(5);
        
        res.json({
            success: true,
            message: 'Database information retrieved',
            info: {
                databaseName: dbName,
                collections: collections.map(c => ({
                    name: c.name,
                    type: c.type
                })),
                userCount: userCount,
                sampleUsers: sampleUsers
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Database info error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get database info',
            error: error.message
        });
    }
};