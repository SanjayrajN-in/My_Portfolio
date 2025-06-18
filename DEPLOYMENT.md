# 🚀 Complete Deployment Guide for Google OAuth + MongoDB

## 📋 Pre-Deployment Checklist

### 1. Google Cloud Console Setup
- [ ] **APIs Enabled**:
  - Google+ API (Legacy)
  - People API
  - Identity and Access Management (IAM) API
- [ ] **OAuth 2.0 Credentials Created**
- [ ] **OAuth Consent Screen Configured and Published**
- [ ] **Domain Verified in Google Search Console**

### 2. Environment Variables
- [ ] `MONGODB_URI` - Your MongoDB connection string
- [ ] `JWT_SECRET` - Strong random secret for JWT tokens
- [ ] `GOOGLE_CLIENT_ID` - From Google Cloud Console
- [ ] `GOOGLE_CLIENT_SECRET` - From Google Cloud Console

### 3. Required Pages
- [ ] Privacy Policy page created (`/pages/privacy.html`)
- [ ] Terms of Service page created (`/pages/terms.html`)

## 🔧 Step-by-Step Deployment

### Step 1: Set Up Environment Variables in Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** > **Environment Variables**
4. Add these variables for **Production**, **Preview**, and **Development**:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random
GOOGLE_CLIENT_ID=1026303958134-nncar1hc3ko280tds9r7fa77f0d7cucu.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret_from_console
```

### Step 2: Configure Google Cloud Console

#### A. Enable Required APIs
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** > **Library**
3. Enable these APIs:
   - **Google+ API**
   - **People API** 
   - **Identity and Access Management (IAM) API**

#### B. Create OAuth 2.0 Credentials
1. Go to **APIs & Services** > **Credentials**
2. Click **"+ CREATE CREDENTIALS"** > **"OAuth 2.0 Client IDs"**
3. Configure:
   - **Application type**: Web application
   - **Name**: Sanjayraj Portfolio
   - **Authorized JavaScript origins**:
     ```
     https://sanjayrajn.vercel.app
     ```
   - **Authorized redirect URIs**:
     ```
     https://sanjayrajn.vercel.app/auth/google/callback
     ```

#### C. Configure OAuth Consent Screen
1. Go to **APIs & Services** > **OAuth consent screen**
2. Choose **External**
3. Fill required fields:
   - **App name**: Sanjayraj Portfolio
   - **User support email**: Your email
   - **App domain**: `https://sanjayrajn.vercel.app`
   - **Privacy Policy URL**: `https://sanjayrajn.vercel.app/pages/privacy`
   - **Terms of Service URL**: `https://sanjayrajn.vercel.app/pages/terms`
   - **Developer contact information**: Your email

#### D. Add OAuth Scopes
1. In OAuth consent screen, go to **Scopes**
2. Add these scopes:
   ```
   ../auth/userinfo.email
   ../auth/userinfo.profile
   openid
   ```

#### E. Publish Your App
1. In OAuth consent screen, click **"PUBLISH APP"**
2. If verification is required, follow Google's process

### Step 3: Verify Domain in Google Search Console

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Add property: `https://sanjayrajn.vercel.app`
3. Verify ownership using HTML file method or DNS

### Step 4: Deploy to Vercel

```bash
# Install Vercel CLI if not already installed
npm install -g vercel

# Deploy to production
vercel --prod
```

### Step 5: Test Your Deployment

1. **Run the test script**:
   ```bash
   npm run test:auth
   ```

2. **Test in browser**:
   - Go to your deployed site
   - Try Google login
   - Check browser console for errors
   - Verify user data is stored in MongoDB

## 🐛 Common Issues & Solutions

### Issue 1: "Error 400: redirect_uri_mismatch"
**Cause**: Redirect URI mismatch between Google Console and your code
**Solution**: 
- Ensure redirect URI in Google Console exactly matches: `https://sanjayrajn.vercel.app/auth/google/callback`
- Check for trailing slashes or typos

### Issue 2: "Error 403: access_denied"
**Cause**: OAuth consent screen not published or user not added as test user
**Solution**:
- Publish your OAuth consent screen in Google Cloud Console
- Or add users as test users during development

### Issue 3: "FedCM get() rejects with IdentityCredentialError"
**Cause**: FedCM (Federated Credential Management) issues
**Solution**: ✅ Already fixed in code:
- Disabled FedCM in frontend (`use_fedcm_for_prompt: false`)
- Added proper CORS headers
- Using popup mode for better compatibility

### Issue 4: CORS Errors
**Cause**: Missing or incorrect CORS headers
**Solution**: ✅ Already fixed:
- Updated `vercel.json` with proper CORS headers
- Added CORS headers in API endpoints
- Using `credentials: 'include'` in fetch requests

### Issue 5: "Network Error" or "ERR_FAILED"
**Cause**: Various network/configuration issues
**Solution**:
- Check if all environment variables are set in Vercel
- Verify Google Cloud Console configuration
- Check browser network tab for specific error details

### Issue 6: MongoDB Connection Issues
**Cause**: Incorrect MongoDB URI or network restrictions
**Solution**:
- Verify MongoDB URI format
- Check MongoDB Atlas network access settings
- Ensure database user has proper permissions

## 🔒 Security Best Practices

### 1. Environment Variables
- ✅ Never commit `.env` files to git
- ✅ Use strong, random JWT secrets
- ✅ Rotate secrets periodically

### 2. CORS Configuration
- ✅ Only allow specific origins
- ✅ Use `credentials: 'include'` only when necessary
- ✅ Set proper CORS headers

### 3. Google OAuth
- ✅ Use HTTPS only in production
- ✅ Verify state parameter in OAuth flow
- ✅ Validate tokens on server side

### 4. Database Security
- ✅ Use MongoDB Atlas with IP restrictions
- ✅ Create database users with minimal permissions
- ✅ Enable MongoDB authentication

## 📊 Monitoring & Maintenance

### 1. Check Logs Regularly
```bash
# View Vercel function logs
vercel logs --follow
```

### 2. Monitor Google Cloud Console
- Check API usage quotas
- Monitor OAuth consent screen status
- Review security alerts

### 3. Database Monitoring
- Monitor MongoDB Atlas metrics
- Set up alerts for connection issues
- Regular backup verification

## 🎯 Performance Optimization

### 1. Frontend Optimization
- ✅ Lazy load Google Identity Services
- ✅ Use popup mode for better UX
- ✅ Implement proper loading states

### 2. Backend Optimization
- ✅ Connection pooling for MongoDB
- ✅ JWT token caching
- ✅ Proper error handling

### 3. Vercel Configuration
- ✅ Proper caching headers
- ✅ Static asset optimization
- ✅ Function timeout configuration

## 🚀 Going Live Checklist

- [ ] All environment variables set in Vercel
- [ ] Google Cloud Console properly configured
- [ ] OAuth consent screen published
- [ ] Domain verified in Google Search Console
- [ ] Privacy policy and terms of service pages live
- [ ] Test Google login flow works
- [ ] MongoDB connection working
- [ ] All CORS issues resolved
- [ ] Error handling tested
- [ ] Performance optimized
- [ ] Security measures in place

## 📞 Support & Troubleshooting

### Debug Steps:
1. **Check browser console** for JavaScript errors
2. **Check Vercel function logs** for backend errors
3. **Verify environment variables** are set correctly
4. **Test Google OAuth flow** step by step
5. **Check MongoDB connection** and permissions

### Useful Commands:
```bash
# Test authentication locally
npm run test:auth

# Deploy to production
vercel --prod

# View deployment logs
vercel logs

# Check environment variables
vercel env ls
```

### Resources:
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Vercel Documentation](https://vercel.com/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Google Cloud Console](https://console.cloud.google.com/)

---

**🎉 Congratulations!** Your Google OAuth + MongoDB authentication system is now ready for production!