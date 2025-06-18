# 🔧 Google Authentication Troubleshooting Guide

## 🚨 **Current Issue: 404 Error on `/api/auth/google`**

### **Root Cause Analysis**
The Google authentication frontend is working correctly (no more console warnings), but the backend API endpoint is returning a 404 error. This indicates one of the following issues:

1. **Vercel Deployment Issue**: API routes not properly deployed
2. **Environment Variables**: Missing on Vercel (but present locally)
3. **Routing Configuration**: Vercel routing not working as expected

---

## 🔍 **Diagnostic Steps**

### **Step 1: Test API Endpoints**
Open these URLs in your browser to test:

1. **API Status Test**: `https://sanjayrajn.vercel.app/api/test/api-status`
2. **Environment Check**: `https://sanjayrajn.vercel.app/api/debug/env-check`
3. **Google Auth Test**: `https://sanjayrajn.vercel.app/api/auth/google` (should return 405 Method Not Allowed for GET)

### **Step 2: Check Vercel Deployment**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Find your project: `sanjayrajn-portfolio`
3. Check **Functions** tab - should show API endpoints
4. Check **Environment Variables** tab

### **Step 3: Verify Environment Variables**
Required variables in Vercel:
```
GOOGLE_CLIENT_ID=1026303958134-nncar1hc3ko280tds9r7fa77f0d7cucu.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=[your-secret]
JWT_SECRET=[your-jwt-secret]
MONGODB_URI=[your-mongodb-connection]
```

---

## 🛠️ **Quick Fixes**

### **Fix 1: Redeploy to Vercel**
```bash
# In your project directory
vercel --prod
```

### **Fix 2: Check Vercel Environment Variables**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add missing variables:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET` 
   - `JWT_SECRET`
   - `MONGODB_URI`
3. Redeploy after adding variables

### **Fix 3: Test Local Development**
```bash
# Install dependencies
npm install

# Start local development server
vercel dev

# Test locally at http://localhost:3000
```

---

## 🎯 **Expected Behavior After Fix**

### **✅ Working State**
- `/api/test/api-status` → Returns JSON with success: true
- `/api/debug/env-check` → Shows all environment variables as true
- `/api/auth/google` → POST requests work, GET returns 405
- Google login button → Works without 404 errors

### **🔍 Console Output (Success)**
```
🔐 Google login button clicked
✅ Using Unified Google Auth
🚀 Initializing Google Popup Auth...
✅ Google Identity Services loaded
✅ Google Identity Services configured
📨 Google credential response received
📤 Sending credential to backend...
🌐 API URL: https://sanjayrajn.vercel.app/api/auth/google
📨 Response status: 200
✅ Google login successful
```

---

## 🚀 **Deployment Checklist**

- [ ] All API files exist in `/api` directory
- [ ] `vercel.json` configuration is correct
- [ ] Environment variables set in Vercel Dashboard
- [ ] Project redeployed after environment variable changes
- [ ] API endpoints accessible via browser
- [ ] Google OAuth credentials configured in Google Cloud Console
- [ ] Domain authorized in Google Cloud Console

---

## 📞 **If Still Not Working**

### **Check These Common Issues:**

1. **Vercel Function Limits**
   - Free tier has function execution limits
   - Check Vercel dashboard for errors

2. **Google Cloud Console**
   - Authorized JavaScript origins: `https://sanjayrajn.vercel.app`
   - Authorized redirect URIs: `https://sanjayrajn.vercel.app/auth/google/callback`
   - OAuth consent screen published

3. **CORS Issues**
   - Check browser network tab for CORS errors
   - Verify Vercel CORS headers configuration

4. **Database Connection**
   - MongoDB Atlas IP whitelist (allow all: 0.0.0.0/0)
   - Connection string format correct

---

## 🎉 **Success Indicators**

When everything is working correctly, you should see:
- ✅ No 404 errors in console
- ✅ Google login popup appears
- ✅ User data stored in localStorage
- ✅ Page refreshes after successful login
- ✅ Clean console output (no warnings)

---

## 📋 **Next Steps**

1. **Test the diagnostic URLs** listed above
2. **Check Vercel Dashboard** for environment variables
3. **Redeploy if needed** with `vercel --prod`
4. **Test Google login** on your live site
5. **Monitor console** for any remaining errors

The Google authentication system is properly implemented - we just need to ensure the backend API is accessible on Vercel!