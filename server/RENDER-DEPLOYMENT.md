# 🚀 Deploy Backend to Render

## Step-by-Step Render Deployment

### 1. Create Render Account
- Go to [render.com](https://render.com) and sign up
- Connect your GitHub account

### 2. Create New Web Service
- Click "New" → "Web Service"
- Connect your GitHub repository OR upload this server folder

### 3. Configure Deployment Settings
```
Environment: Node
Build Command: npm install
Start Command: npm start
Node Version: 18
```

### 4. Set Environment Variables

In Render dashboard, add these environment variables:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/portfolio
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random
JWT_EXPIRE=30d

# Email Service (Gmail)
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Server Settings
PORT=3000
NODE_ENV=production
```

### 5. MongoDB Setup
If you don't have MongoDB:
1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Create free cluster
3. Get connection string
4. Add to `MONGODB_URI` in Render

### 6. Gmail Setup for OTP
1. Enable 2-Factor Authentication on Gmail
2. Go to Google Account Settings
3. Generate App Password for "Mail"
4. Use that password in `EMAIL_PASS`

### 7. Deploy!
- Click "Deploy" in Render
- Wait for deployment to complete
- Your backend will be live at: `https://your-app-name.onrender.com`

### 8. Update Frontend
After deployment, update your frontend:
- Replace `https://your-backend-app.onrender.com` in frontend files
- With your actual Render URL

### 9. Test Your API
Test these endpoints:
- `GET https://your-app.onrender.com/api/health`
- `POST https://your-app.onrender.com/api/auth/login`

## ✅ What's Included

- ✅ User Registration & Login
- ✅ Email Verification (OTP) 
- ✅ Password Reset
- ✅ JWT Authentication
- ✅ Rate Limiting & Security
- ✅ MongoDB Integration
- ✅ Google OAuth Support
- ✅ Profile Management
- ✅ Game Statistics

## 🔧 Troubleshooting

**Build Failed?**
- Check your `package.json` has all dependencies
- Make sure Node version is 18+

**Can't Connect to Database?**
- Check `MONGODB_URI` is correct
- Make sure MongoDB Atlas allows connections from anywhere (0.0.0.0/0)

**CORS Issues?**
- Add your frontend domain to CORS settings in `server.js`

**Email Not Working?**
- Check Gmail app password is correct
- Make sure 2FA is enabled on Gmail