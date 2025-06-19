# Vercel Deployment Guide

This guide will help you deploy your full-stack application (frontend + backend + MongoDB) to Vercel.

## Prerequisites

1. A Vercel account (sign up at [vercel.com](https://vercel.com))
2. A MongoDB Atlas account (sign up at [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas))
3. Your project code pushed to a GitHub repository

## Step 1: Set Up MongoDB Atlas

1. Create a new cluster in MongoDB Atlas
2. Set up a database user with read/write permissions
3. Configure network access (IP whitelist) to allow connections from anywhere (0.0.0.0/0)
4. Get your MongoDB connection string:
   - Go to "Clusters" > "Connect" > "Connect your application"
   - Select "Node.js" as the driver and copy the connection string
   - Replace `<password>` with your database user's password

## Step 2: Set Up Environment Variables in Vercel

1. Go to your Vercel dashboard
2. Select your project (or import it from GitHub if not already done)
3. Go to "Settings" > "Environment Variables"
4. Add the following environment variables:
   - `MONGODB_URI`: Your MongoDB connection string
   - `JWT_SECRET`: A secure random string for JWT token generation
   - `GOOGLE_CLIENT_ID`: Your Google OAuth client ID (if using Google Auth)
   - `GOOGLE_CLIENT_SECRET`: Your Google OAuth client secret (if using Google Auth)
   - `FRONTEND_URL`: The URL of your deployed frontend (e.g., https://your-app.vercel.app)
   - `OAUTH_CALLBACK_URL`: The callback URL for OAuth (e.g., https://your-app.vercel.app/auth/google/callback)
   - `EMAIL_USER`: Your email address for sending emails
   - `EMAIL_PASS`: Your email app password
   - `APP_NAME`: Your application name

## Step 3: Deploy to Vercel

1. Make sure your project has a `vercel.json` file (already included in this project)
2. Push your code to GitHub
3. In Vercel dashboard, import your project from GitHub
4. Configure the project:
   - Build Command: `npm run build`
   - Output Directory: Leave as default (auto-detected)
   - Install Command: `npm install`
5. Click "Deploy"

## Step 4: Verify Deployment

1. Once deployment is complete, visit your deployed application URL
2. Test the API endpoints:
   - `/api/hello` - Should return a simple JSON response
   - `/api/test/db-connection` - Should verify MongoDB connection

## Troubleshooting

### MongoDB Connection Issues

If you're having trouble connecting to MongoDB:

1. Check that your `MONGODB_URI` environment variable is correctly set in Vercel
2. Ensure your MongoDB Atlas cluster is running and accessible
3. Verify that your IP whitelist in MongoDB Atlas includes `0.0.0.0/0` to allow connections from Vercel
4. Check the logs in Vercel for any connection errors

### API Endpoint Issues

If your API endpoints are not working:

1. Check the Vercel Function Logs for errors
2. Verify that all API files are using ES modules syntax (export default)
3. Make sure your `vercel.json` file is correctly configured
4. Test endpoints locally using `vercel dev` before deploying

### CORS Issues

If you're experiencing CORS errors:

1. Check that your `vercel.json` file has the correct CORS headers
2. Ensure the `Access-Control-Allow-Origin` header is set correctly
3. For development, you can set it to `*` but for production, set it to your specific domain

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Mongoose Documentation](https://mongoosejs.com/docs/)