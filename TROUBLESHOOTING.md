# Google Authentication Troubleshooting Guide

This guide will help you troubleshoot issues with Google Authentication in your portfolio application.

## Recent Changes

We've made several improvements to the authentication system:

1. Enhanced MongoDB connection error handling
2. Improved Google OAuth error reporting
3. Added detailed environment variable validation
4. Created diagnostic test endpoints
5. Fixed CORS headers for authentication requests

## Testing Your Setup

To verify that your environment is properly configured, follow these steps:

### 1. Check Environment Variables

Make sure these environment variables are correctly set in your Vercel deployment:

- `MONGODB_URI`: Your MongoDB connection string
- `GOOGLE_CLIENT_ID`: Your Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Your Google OAuth client secret
- `OAUTH_CALLBACK_URL`: The callback URL for Google OAuth (should be `https://sanjayrajn.vercel.app/api/auth/callback`)
- `JWT_SECRET`: Secret for JWT token generation

### 2. Use the Diagnostic Endpoints

Visit these endpoints to check your configuration:

- `https://sanjayrajn.vercel.app/api/health` - Basic API health check
- `https://sanjayrajn.vercel.app/api/env-test` - Environment variables test
- `https://sanjayrajn.vercel.app/api/mongodb-test` - MongoDB connection test
- `https://sanjayrajn.vercel.app/api/test-google-auth` - Google OAuth credentials test

### 3. Check Vercel Logs

If you're still experiencing issues, check the Vercel Function Logs for detailed error messages.

## Common Issues and Solutions

### MongoDB Connection Issues

- **Error**: "MongoDB connection failed"
- **Solution**: Verify your MongoDB URI is correct and that your IP address is whitelisted in MongoDB Atlas.

### Google OAuth Issues

- **Error**: "Invalid client"
- **Solution**: Verify your Google Client ID and Client Secret are correct.

- **Error**: "Redirect URI mismatch"
- **Solution**: Make sure the redirect URI in your Google Cloud Console matches `OAUTH_CALLBACK_URL`.

### CORS Issues

- **Error**: CORS policy errors in browser console
- **Solution**: The API now sets proper CORS headers, but make sure your frontend is making requests from an allowed origin.

## Testing Google Login Locally

To test Google login locally:

1. Set up environment variables in a `.env` file
2. Run the application locally
3. Use the test endpoints to verify your configuration
4. Try logging in with Google

## Need More Help?

If you're still experiencing issues, check:

1. Google Cloud Console settings for your OAuth credentials
2. MongoDB Atlas dashboard for connection issues
3. Vercel Function Logs for detailed error messages