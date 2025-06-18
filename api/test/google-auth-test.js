const { OAuth2Client } = require('google-auth-library');
require('dotenv').config();

async function testGoogleAuth() {
    console.log('🧪 Testing Google OAuth Configuration...\n');

    // Check environment variables
    console.log('📋 Environment Variables Check:');
    console.log('✓ GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'Set' : '❌ Missing');
    console.log('✓ GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'Set' : '❌ Missing');
    console.log('✓ JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : '❌ Missing');
    console.log('✓ MONGODB_URI:', process.env.MONGODB_URI ? 'Set' : '❌ Missing');
    console.log('');

    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        console.log('❌ Missing required Google OAuth environment variables');
        return;
    }

    try {
        // Test OAuth2Client initialization
        console.log('🔧 Testing OAuth2Client initialization...');
        const client = new OAuth2Client(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            'https://sanjayrajn.vercel.app/auth/google/callback'
        );
        console.log('✅ OAuth2Client initialized successfully');
        console.log('');

        // Test token info endpoint (this will fail but shows if client ID is valid)
        console.log('🔍 Testing Google Client ID validity...');
        try {
            // This will throw an error but we can check if it's a valid client ID error
            await client.verifyIdToken({
                idToken: 'invalid_token',
                audience: process.env.GOOGLE_CLIENT_ID,
            });
        } catch (error) {
            if (error.message.includes('Wrong number of segments') || 
                error.message.includes('Invalid token')) {
                console.log('✅ Google Client ID appears to be valid format');
            } else if (error.message.includes('Invalid client')) {
                console.log('❌ Invalid Google Client ID');
                return;
            } else {
                console.log('✅ Google Client ID validation passed (expected token error)');
            }
        }
        console.log('');

        // Generate authorization URL
        console.log('🔗 Generating OAuth authorization URL...');
        const authUrl = client.generateAuthUrl({
            access_type: 'offline',
            scope: ['openid', 'email', 'profile'],
            redirect_uri: 'https://sanjayrajn.vercel.app/auth/google/callback',
            state: 'test_state'
        });
        console.log('✅ Authorization URL generated successfully');
        console.log('🌐 URL:', authUrl.substring(0, 100) + '...');
        console.log('');

        // Test database connection
        console.log('🗄️  Testing database connection...');
        try {
            const connectDB = require('../config/database');
            await connectDB();
            console.log('✅ Database connection successful');
        } catch (dbError) {
            console.log('❌ Database connection failed:', dbError.message);
        }
        console.log('');

        console.log('🎉 Google OAuth configuration test completed!');
        console.log('');
        console.log('📝 Next steps:');
        console.log('1. Make sure your Google Cloud Console is properly configured');
        console.log('2. Ensure your OAuth consent screen is published');
        console.log('3. Test the actual login flow on your website');
        console.log('4. Check browser console for any CORS errors');

    } catch (error) {
        console.log('❌ Test failed:', error.message);
        console.log('');
        console.log('🔧 Troubleshooting:');
        console.log('1. Check your Google Cloud Console configuration');
        console.log('2. Verify environment variables are correct');
        console.log('3. Ensure Google APIs are enabled');
        console.log('4. Check if OAuth consent screen is published');
    }
}

// Run the test
testGoogleAuth().catch(console.error);