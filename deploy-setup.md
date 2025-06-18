# Google OAuth Setup Guide

## 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API and Google Identity API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Set Application type to "Web application"
6. Add these Authorized redirect URIs:
   - `https://sanjayrajn.vercel.app/auth/google/callback`
   - `http://localhost:3000/auth/google/callback` (for testing)

## 2. Vercel Environment Variables

Set these environment variables in your Vercel dashboard:

```
GOOGLE_CLIENT_ID=1026303958134-nncar1hc3ko280tds9r7fa77f0d7cucu.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
MONGODB_URI=mongodb+srv://sanjayrajnblr:ioEImUdcGCawVWzy@cluster0.jpgyhs3.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=amsnnnnjfbse_SRN_2025_1289!@
```

## 3. Testing

1. Deploy to Vercel
2. Visit: `https://sanjayrajn.vercel.app/test-oauth`
3. Click "Test Google OAuth Login"
4. Complete the OAuth flow
5. Check if it returns success

## 4. Common Issues & Solutions

### CORS Errors
- Make sure the redirect URI exactly matches what's in Google Cloud Console
- Check that environment variables are set in Vercel

### FedCM Errors
- We're using manual OAuth flow to avoid FedCM issues
- Don't include Google Identity Services script

### Network Errors
- Check Vercel function logs
- Verify environment variables are accessible

## 5. Deploy Commands

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod

# Set environment variables
vercel env add GOOGLE_CLIENT_ID
vercel env add GOOGLE_CLIENT_SECRET
vercel env add MONGODB_URI
vercel env add JWT_SECRET
```

## 6. Debugging

Check logs in:
- Vercel Dashboard → Functions → View Function Logs
- Browser Console for frontend errors
- Network tab for API call failures