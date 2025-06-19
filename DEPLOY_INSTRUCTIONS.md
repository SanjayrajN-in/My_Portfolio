# Deployment Instructions

Follow these steps to deploy the Google Authentication fixes:

## 1. Commit and Push Changes

```bash
git add .
git commit -m "Fix Google authentication and add diagnostic endpoints"
git push origin main
```

## 2. Verify Deployment in Vercel

1. Go to your Vercel dashboard
2. Check that the deployment was successful
3. If there are any errors, check the build logs

## 3. Test the Diagnostic Endpoints

Visit these endpoints to check your configuration:

- `https://sanjayrajn.vercel.app/api/health`
- `https://sanjayrajn.vercel.app/api/env-test`
- `https://sanjayrajn.vercel.app/api/mongodb-test`
- `https://sanjayrajn.vercel.app/api/test-mongodb`
- `https://sanjayrajn.vercel.app/api/test-google-auth`

## 4. Check Environment Variables

Make sure these environment variables are set in your Vercel project:

- `MONGODB_URI`: Your MongoDB connection string
- `GOOGLE_CLIENT_ID`: Your Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Your Google OAuth client secret
- `JWT_SECRET`: Secret for JWT token generation
- `OAUTH_CALLBACK_URL`: Should be `https://sanjayrajn.vercel.app/api/auth/callback`

## 5. Test Google Login

After verifying all the above, try logging in with Google again.

## Troubleshooting

If you encounter any issues, refer to the `GOOGLE_AUTH_FIX.md` file for detailed troubleshooting steps.