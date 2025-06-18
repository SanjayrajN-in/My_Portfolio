// Google Auth Test Script
const connectDB = require('../config/database');

async function testGoogleAuth() {
    console.log('🧪 Testing Google Authentication Setup...\n');
    
    // Test 1: Environment Variables
    console.log('1. Testing Environment Variables:');
    const requiredEnvVars = [
        'MONGODB_URI',
        'JWT_SECRET',
        'GOOGLE_CLIENT_ID',
        'GOOGLE_CLIENT_SECRET'
    ];
    
    let envTestPassed = true;
    requiredEnvVars.forEach(envVar => {
        if (process.env[envVar]) {
            console.log(`   ✅ ${envVar}: Set`);
        } else {
            console.log(`   ❌ ${envVar}: Missing`);
            envTestPassed = false;
        }
    });
    
    if (!envTestPassed) {
        console.log('\n❌ Environment variables test failed. Please check your .env file or Vercel environment variables.');
        return;
    }
    
    // Test 2: Database Connection
    console.log('\n2. Testing Database Connection:');
    try {
        await connectDB();
        console.log('   ✅ MongoDB connection successful');
    } catch (error) {
        console.log('   ❌ MongoDB connection failed:', error.message);
        return;
    }
    
    // Test 3: Google OAuth Client
    console.log('\n3. Testing Google OAuth Client:');
    try {
        const { OAuth2Client } = require('google-auth-library');
        const client = new OAuth2Client(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            'https://sanjayrajn.vercel.app/auth/google/callback'
        );
        console.log('   ✅ Google OAuth client initialized successfully');
        
        // Test client ID format
        if (process.env.GOOGLE_CLIENT_ID.includes('.apps.googleusercontent.com')) {
            console.log('   ✅ Google Client ID format is correct');
        } else {
            console.log('   ⚠️  Google Client ID format may be incorrect');
        }
        
    } catch (error) {
        console.log('   ❌ Google OAuth client initialization failed:', error.message);
        return;
    }
    
    // Test 4: JWT Secret Strength
    console.log('\n4. Testing JWT Secret:');
    const jwtSecret = process.env.JWT_SECRET;
    if (jwtSecret.length >= 32) {
        console.log('   ✅ JWT secret is strong enough (32+ characters)');
    } else {
        console.log('   ⚠️  JWT secret should be at least 32 characters long');
    }
    
    // Test 5: User Model
    console.log('\n5. Testing User Model:');
    try {
        const User = require('../models/User');
        console.log('   ✅ User model loaded successfully');
        
        // Test creating a test user (without saving)
        const testUser = new User({
            name: 'Test User',
            email: 'test@example.com',
            googleId: 'test123',
            avatar: 'test-avatar.jpg',
            isVerified: true,
            gameStats: {
                totalGamesPlayed: 0,
                totalScore: 0,
                achievements: [],
                favoriteGame: null
            }
        });
        
        const validationError = testUser.validateSync();
        if (!validationError) {
            console.log('   ✅ User model validation passed');
        } else {
            console.log('   ❌ User model validation failed:', validationError.message);
        }
        
    } catch (error) {
        console.log('   ❌ User model test failed:', error.message);
    }
    
    console.log('\n🎉 Google Authentication setup test completed!');
    console.log('\nNext steps:');
    console.log('1. Deploy to Vercel');
    console.log('2. Update Google Cloud Console with your production domain');
    console.log('3. Test Google login on your live site');
    
    process.exit(0);
}

// Run the test
if (require.main === module) {
    testGoogleAuth().catch(error => {
        console.error('Test failed:', error);
        process.exit(1);
    });
}

module.exports = testGoogleAuth;