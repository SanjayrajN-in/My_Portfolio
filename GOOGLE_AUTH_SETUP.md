# Google Authentication Setup Guide

## 🚀 Complete Google Cloud Console Configuration

### Step 1: Enable Required APIs

Go to [Google Cloud Console](https://console.cloud.google.com/) and enable these APIs:

1. **Google+ API** (Legacy but required)
   - Go to APIs & Services > Library
   - Search for "Google+ API"
   - Click Enable

2. **People API** (Modern replacement)
   - Search for "People API"
   - Click Enable

3. **Identity and Access Management (IAM) API**
   - Search for "Identity and Access Management (IAM) API"
   - Click Enable

### Step 2: Configure OAuth 2.0 Credentials

1. Go to **APIs & Services > Credentials**
2. Click **"+ CREATE CREDENTIALS"** > **"OAuth 2.0 Client IDs"**
3. Configure:
   - **Application type**: Web application
   - **Name**: Your app name (e.g., "Sanjayraj Portfolio")
   - **Authorized JavaScript origins**:
     ```
     https://sanjayrajn.vercel.app
     http://localhost:3000 (for development)
     ```
   - **Authorized redirect URIs**:
     ```
     https://sanjayrajn.vercel.app/auth/google/callback
     http://localhost:3000/auth/google/callback (for development)
     ```

### Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services > OAuth consent screen**
2. Choose **External** (for public use)
3. Fill out required fields:
   - **App name**: Sanjayraj Portfolio
   - **User support email**: Your email
   - **Developer contact information**: Your email
   - **App domain**: https://sanjayrajn.vercel.app
   - **Privacy Policy URL**: https://sanjayrajn.vercel.app/privacy (create this page)
   - **Terms of Service URL**: https://sanjayrajn.vercel.app/terms (create this page)

### Step 4: Add Scopes

1. In OAuth consent screen, go to **Scopes**
2. Add these scopes:
   ```
   ../auth/userinfo.email
   ../auth/userinfo.profile
   openid
   ```

### Step 5: Publish Your App (CRITICAL for Production)

⚠️ **Your app must be published for production use!**

1. In OAuth consent screen, click **"PUBLISH APP"**
2. If you see verification required:
   - You need to verify your domain in Google Search Console
   - Provide privacy policy and terms of service
   - May need Google verification (can take 1-7 days)

### Step 6: Test Users (During Development)

While your app is in testing mode, add test users:
1. Go to OAuth consent screen > Test users
2. Add your email and any other test emails

## 🔧 Environment Variables Setup

Create a `.env` file in your project root:

```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority

# JWT Secret (use a strong random string)
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random

# Google OAuth Configuration
GOOGLE_CLIENT_ID=1026303958134-nncar1hc3ko280tds9r7fa77f0d7cucu.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret_from_console

# Frontend URL
FRONTEND_URL=https://sanjayrajn.vercel.app
```

## 🔒 Security Best Practices

### 1. Environment Variables in Vercel

1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings > Environment Variables
4. Add all variables from your `.env` file
5. Make sure to set them for Production, Preview, and Development

### 2. Domain Verification

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Add your domain: `https://sanjayrajn.vercel.app`
3. Verify ownership using HTML file or DNS record

### 3. HTTPS Only

- Always use HTTPS in production
- Google OAuth requires HTTPS for security

## 🐛 Common Issues & Solutions

### Issue 1: "Error 400: redirect_uri_mismatch"
**Solution**: Make sure your redirect URI in Google Console exactly matches what you're using in code.

### Issue 2: "Error 403: access_denied"
**Solution**: Your app needs to be published or user needs to be added as test user.

### Issue 3: "FedCM get() rejects with IdentityCredentialError"
**Solution**: 
- Disable FedCM in your frontend code (already done)
- Use popup mode instead
- Ensure proper CORS headers

### Issue 4: "CORS errors"
**Solution**:
- Check Vercel.json configuration
- Ensure backend sets proper CORS headers
- Use `credentials: 'include'` in fetch requests

## 🚀 Deployment Checklist

- [ ] Google Cloud Console APIs enabled
- [ ] OAuth credentials configured with correct domains
- [ ] OAuth consent screen configured and published
- [ ] Environment variables set in Vercel
- [ ] Domain verified in Google Search Console
- [ ] Privacy policy and terms of service pages created
- [ ] CORS headers properly configured
- [ ] Test the complete flow in production

## 📱 Browser Compatibility

### Supported Browsers:
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

### Known Issues:
- Safari may block third-party cookies (use SameSite=None)
- Some ad blockers may interfere with Google auth
- Incognito mode may have restrictions

## 🔍 Testing Your Setup

1. Open browser developer tools
2. Go to your site
3. Try Google login
4. Check console for any errors
5. Verify user data is stored correctly
6. Test logout and re-login

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Check Vercel function logs
3. Verify all environment variables are set
4. Ensure Google Cloud Console is properly configured
5. Test with different browsers/devices