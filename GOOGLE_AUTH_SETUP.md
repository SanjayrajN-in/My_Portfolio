# Google Authentication Setup Guide

## 🚀 Complete Setup for Google Login with MongoDB

This guide will help you set up Google OAuth authentication for your Vercel-deployed portfolio website.

## 1. Google Cloud Console Configuration

### Step 1: Create/Configure Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Enable the **Google+ API** and **Google Identity Services**

### Step 2: Configure OAuth Consent Screen
1. Go to **APIs & Services** > **OAuth consent screen**
2. Choose **External** user type
3. Fill in required fields:
   - App name: `Sanjayraj Portfolio`
   - User support email: `your-email@gmail.com`
   - Developer contact: `your-email@gmail.com`
4. Add scopes: `email`, `profile`, `openid`
5. Add test users if needed

### Step 3: Create OAuth 2.0 Credentials
1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth 2.0 Client IDs**
3. Choose **Web application**
4. Configure:
   - **Name**: `Portfolio Web Client`
   - **Authorized JavaScript origins**: 
     ```
     https://sanjayrajn.vercel.app
     ```
   - **Authorized redirect URIs**:
     ```
     https://sanjayrajn.vercel.app/auth/google/callback
     ```

## 2. Environment Variables Setup

### Vercel Environment Variables
Add these to your Vercel dashboard under **Settings** > **Environment Variables**:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
JWT_SECRET=your_super_secure_jwt_secret_here
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
FRONTEND_URL=https://sanjayrajn.vercel.app
```

### Local Development (.env file)
```env
PORT=3000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
JWT_SECRET=your_super_secure_jwt_secret_here
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
OAUTH_CALLBACK_URL=https://sanjayrajn.vercel.app/
FRONTEND_URL=https://sanjayrajn.vercel.app
```

## 3. MongoDB User Schema

Your User model should include these fields:
```javascript
{
  name: String,
  email: String,
  googleId: String,
  avatar: String,
  isVerified: Boolean,
  gameStats: {
    totalGamesPlayed: Number,
    totalScore: Number,
    achievements: Array,
    favoriteGame: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

## 4. Frontend Implementation

### Google Login Button
The system includes two implementations:
1. **Modern Google Identity Services** (preferred)
2. **Manual OAuth Flow** (fallback)

### Usage in HTML
```html
<!-- The login modal automatically includes Google login -->
<button onclick="openLoginModal()">Login</button>
```

## 5. Backend API Endpoints

### `/api/auth/google` (POST)
Handles both:
- JWT tokens from Google Identity Services
- OAuth authorization codes from manual flow

**Request Body Options:**
```javascript
// Option 1: JWT Token (Google Identity Services)
{
  "credential": "jwt_token_from_google"
}

// Option 2: OAuth Code (Manual Flow)
{
  "code": "authorization_code",
  "redirect_uri": "https://sanjayrajn.vercel.app/auth/google/callback"
}
```

**Response:**
```javascript
{
  "success": true,
  "message": "Google login successful",
  "user": {
    "id": "user_id",
    "name": "User Name",
    "email": "user@email.com",
    "avatar": "avatar_url",
    "gameStats": {...}
  },
  "token": "jwt_token"
}
```

## 6. CORS Configuration

### Vercel Headers (vercel.json)
```json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "https://sanjayrajn.vercel.app"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET, POST, PUT, DELETE, OPTIONS"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "Content-Type, Authorization, X-Requested-With"
        },
        {
          "key": "Access-Control-Allow-Credentials",
          "value": "true"
        }
      ]
    }
  ]
}
```

## 7. Deployment Steps

### 1. Update Google Cloud Console
- Add your production domain to authorized origins
- Add callback URL to authorized redirect URIs

### 2. Set Environment Variables in Vercel
- Go to Vercel Dashboard > Your Project > Settings > Environment Variables
- Add all required variables

### 3. Deploy to Vercel
```bash
npm run deploy
# or
vercel --prod
```

### 4. Test the Implementation
1. Visit your live site
2. Click login button
3. Try Google login
4. Check browser console for any errors
5. Verify user data is stored in MongoDB

## 8. Troubleshooting

### Common Issues and Solutions

#### CORS Errors
- Ensure your domain is added to Google Cloud Console
- Check Vercel headers configuration
- Verify environment variables are set

#### "Invalid Client" Error
- Double-check Google Client ID
- Ensure authorized origins match exactly
- Check for typos in domain names

#### FedCM Errors
- The system automatically falls back to manual OAuth
- Modern browsers may show FedCM warnings (safe to ignore)

#### Database Connection Issues
- Verify MongoDB URI is correct
- Check network access in MongoDB Atlas
- Ensure database user has proper permissions

### Debug Mode
Add this to your environment variables for detailed logging:
```env
NODE_ENV=development
```

## 9. Security Best Practices

1. **Never expose secrets in frontend code**
2. **Use HTTPS only** (enforced by Google)
3. **Validate all tokens** on the backend
4. **Implement rate limiting** for auth endpoints
5. **Use secure JWT secrets** (minimum 32 characters)
6. **Regularly rotate secrets**

## 10. Testing Checklist

- [ ] Google Cloud Console configured correctly
- [ ] Environment variables set in Vercel
- [ ] CORS headers working
- [ ] Google login button appears
- [ ] OAuth flow completes successfully
- [ ] User data saved to MongoDB
- [ ] JWT token generated and stored
- [ ] Login state persists across page reloads
- [ ] Logout functionality works
- [ ] Error handling works for failed logins

## 11. Support

If you encounter issues:
1. Check browser console for errors
2. Check Vercel function logs
3. Verify all environment variables
4. Test with different browsers
5. Check Google Cloud Console quotas

---

**Note**: This setup supports both modern Google Identity Services and fallback OAuth flow for maximum compatibility across all browsers and scenarios.