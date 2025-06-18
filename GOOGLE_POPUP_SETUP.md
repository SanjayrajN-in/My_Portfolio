# Google Popup Login Setup Guide

## 🚨 Critical Issues & Solutions

### Issue 1: ERR_FAILED while fetching ID assertion
**Root Cause**: CORS configuration or Google Cloud Console setup
**Solution**: 
1. Verify Google Cloud Console configuration (see below)
2. Ensure proper CORS headers in backend
3. Use popup mode instead of redirect mode

### Issue 2: Server did not send the correct CORS headers
**Root Cause**: Backend CORS configuration
**Solution**: Updated backend with comprehensive CORS headers including:
- `Access-Control-Allow-Origin`
- `Access-Control-Allow-Credentials: true`
- `Cross-Origin-Opener-Policy: same-origin-allow-popups`

### Issue 3: FedCM get() rejects with IdentityCredentialError
**Root Cause**: Browser's Federated Credential Management conflicts
**Solution**: Disabled FedCM in popup auth implementation with `use_fedcm_for_prompt: false`

## 🔧 Google Cloud Console Configuration

### Step 1: OAuth 2.0 Client ID Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services > Credentials**
3. Find your OAuth 2.0 Client ID: `1026303958134-nncar1hc3ko280tds9r7fa77f0d7cucu.apps.googleusercontent.com`

### Step 2: Authorized JavaScript Origins
**CRITICAL**: Add these exact URLs:
```
https://sanjayrajn.vercel.app
http://localhost:3000
```

### Step 3: Authorized Redirect URIs
**For popup mode, you can REMOVE all redirect URIs or keep only:**
```
https://sanjayrajn.vercel.app/auth/google/callback
```

### Step 4: OAuth Consent Screen
1. Go to **APIs & Services > OAuth consent screen**
2. **CRITICAL**: Your app MUST be published for production use
3. Required fields:
   - App name: `Sanjayraj Portfolio`
   - User support email: Your email
   - Developer contact: Your email
   - App domain: `https://sanjayrajn.vercel.app`
   - Privacy Policy: `https://sanjayrajn.vercel.app/privacy`
   - Terms of Service: `https://sanjayrajn.vercel.app/terms`

### Step 5: Required Scopes
Add these scopes:
```
../auth/userinfo.email
../auth/userinfo.profile
openid
```

### Step 6: Publish Your App
**⚠️ MOST IMPORTANT**: Click **"PUBLISH APP"** button
- If verification is required, complete the verification process
- This can take 1-7 days for Google to review

## 🔍 Testing Your Setup

### Method 1: Use Test Page
1. Visit: `https://sanjayrajn.vercel.app/test-google-auth.html`
2. Run all tests to identify issues
3. Check browser console for detailed logs

### Method 2: Manual Testing
1. Open browser developer tools
2. Go to your main site
3. Click Google login button
4. Check for errors in console

## 🛠️ Implementation Details

### Frontend Changes Made:
1. **New Popup Auth Script**: `js/google-popup-auth.js`
   - Proper Google Identity Services initialization
   - Popup-specific configuration
   - FedCM disabled to avoid browser conflicts
   - Comprehensive error handling

2. **Updated Login Modal**: `js/login-modal.js`
   - Integrated with new popup auth system
   - Fallback to redirect method if popup fails

3. **CORS Headers**: Enhanced for popup compatibility

### Backend Changes Made:
1. **Enhanced CORS**: `api/auth/google.js`
   - Added Google's domain to allowed origins
   - Popup-specific headers
   - Better error handling for popup mode

2. **Vercel Configuration**: `vercel.json`
   - Updated CORS headers
   - Popup-compatible policies

## 🐛 Common Issues & Solutions

### Issue: "Popup blocked"
**Solution**: 
- Ensure user clicks the button (not programmatic)
- Check browser popup blocker settings
- Use `window.open()` with proper parameters

### Issue: "Invalid client ID"
**Solution**:
- Verify client ID matches Google Cloud Console
- Check for typos in client ID
- Ensure domain is authorized

### Issue: "Access denied"
**Solution**:
- Publish your app in Google Cloud Console
- Add user as test user if app is in testing mode
- Check OAuth consent screen configuration

### Issue: "CORS error"
**Solution**:
- Verify backend CORS headers
- Check Vercel configuration
- Ensure `credentials: 'include'` in fetch requests

## 📋 Deployment Checklist

- [ ] Google Cloud Console OAuth client configured
- [ ] Authorized JavaScript origins added
- [ ] OAuth consent screen completed
- [ ] **App published (not in testing mode)**
- [ ] Required APIs enabled (Google+ API, People API)
- [ ] Environment variables set in Vercel
- [ ] CORS headers properly configured
- [ ] Test page shows all green status
- [ ] Popup login works in production

## 🔒 Security Considerations

1. **HTTPS Only**: Google OAuth requires HTTPS in production
2. **Domain Verification**: Verify domain ownership in Google Search Console
3. **Environment Variables**: Never expose client secret in frontend
4. **CORS**: Restrict origins to your actual domains
5. **State Parameter**: Used for CSRF protection in OAuth flow

## 📱 Browser Compatibility

### Supported:
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

### Known Issues:
- Safari may block third-party cookies
- Some ad blockers interfere with Google auth
- Incognito mode may have restrictions

## 🚀 Next Steps

1. **Test the implementation**:
   ```bash
   # Visit your test page
   https://sanjayrajn.vercel.app/test-google-auth.html
   ```

2. **Check Google Cloud Console**:
   - Ensure app is published
   - Verify all configurations

3. **Monitor logs**:
   - Check Vercel function logs
   - Monitor browser console for errors

4. **User testing**:
   - Test with different browsers
   - Test with different users
   - Test popup blockers

## 📞 Support

If issues persist:
1. Check the test page for specific errors
2. Verify Google Cloud Console configuration
3. Check Vercel function logs
4. Test with different browsers/devices
5. Ensure app is published (not in testing mode)

## 🎯 Expected Behavior

After implementing these changes:
1. ✅ Google login button triggers popup
2. ✅ User authenticates in popup window
3. ✅ Popup closes automatically
4. ✅ User is logged in without page refresh
5. ✅ User data is stored in localStorage
6. ✅ Navigation updates to show user avatar