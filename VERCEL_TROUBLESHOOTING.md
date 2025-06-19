# 🔧 Vercel Deployment Troubleshooting Guide

## Common Deployment Errors and Solutions

### 1. Configuration Conflicts in vercel.json

**Error Message:**
```
Error: If `rewrites`, `redirects`, `headers`, `cleanUrls` or `trailingSlash` are used, then `routes` cannot be present.
```

**Solution:**
- You cannot use both `routes` and other routing configurations like `rewrites`, `headers`, etc.
- Convert your `routes` to `rewrites` using this format:

```json
// INCORRECT
"routes": [
  {
    "src": "/api/(.*)",
    "dest": "/api/$1"
  }
]

// CORRECT
"rewrites": [
  {
    "source": "/api/:path*",
    "destination": "/api/:path*"
  }
]
```

- Run the `deploy-vercel.ps1` script which can automatically fix this issue

### 2. Invalid Function Runtime Version

**Error Message:**
```
Error: Function Runtimes must have a valid version, for example `now-php@1.0.0`.
```

**Solution:**
- You need to specify a version for each function runtime in your `vercel.json` file
- Update your function definitions to include version numbers:

```json
// INCORRECT
"functions": {
  "api/auth/google.js": {
    "runtime": "@vercel/node"
  }
}

// CORRECT
"functions": {
  "api/auth/google.js": {
    "runtime": "@vercel/node@1.15.4"
  }
}
```

- Common runtime versions:
  - `@vercel/node@1.15.4` - For Node.js functions
  - `@vercel/python@3.1.0` - For Python functions
  - `@vercel/go@1.2.3` - For Go functions
  - `@vercel/ruby@1.2.6` - For Ruby functions

### 3. Missing Serverless Function Files

**Error Message:**
```
Error: The pattern "api/test/api-status.js" defined in `functions` doesn't match any Serverless Functions inside the `api` directory.
```

**Solution:**
- This error occurs when Vercel can't find the API files referenced in your configuration
- Options to fix:
  1. **Remove the functions section entirely** - Vercel will auto-detect your API files
  2. **Correct the file paths** - Make sure the paths in `functions` match your actual file structure
  3. **Create the missing files** - Add the referenced files to your project

- Simplified configuration without functions section:
```json
{
  "version": 2,
  "rewrites": [
    { "source": "/api/:path*", "destination": "/api/:path*" },
    { "source": "/auth/google/callback", "destination": "/auth/google/callback.html" }
  ],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "https://sanjayrajn.vercel.app" },
        { "key": "Access-Control-Allow-Methods", "value": "GET, POST, PUT, DELETE, OPTIONS" },
        { "key": "Access-Control-Allow-Headers", "value": "Content-Type, Authorization" },
        { "key": "Access-Control-Allow-Credentials", "value": "true" }
      ]
    }
  ]
}
```

### 2. Missing Environment Variables

**Error Message:**
```
Error: MONGODB_URI is not defined
```

**Solution:**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add these required variables:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
3. Redeploy your application

### 3. API Routes Not Found (404 Errors)

**Error Message:**
```
404: NOT_FOUND
```

**Solution:**
1. Ensure your API files are in the correct location
2. Check that all API files are listed in the `functions` section of `vercel.json`
3. Verify that your `rewrites` are correctly configured
4. Check Vercel logs for specific error messages

### 4. CORS Issues

**Error Message:**
```
Access to fetch at 'https://sanjayrajn.vercel.app/api/auth/google' from origin 'https://sanjayrajn.vercel.app' has been blocked by CORS policy
```

**Solution:**
1. Ensure your API endpoints have proper CORS headers:
```javascript
res.setHeader('Access-Control-Allow-Origin', 'https://sanjayrajn.vercel.app');
res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
res.setHeader('Access-Control-Allow-Credentials', 'true');
```

2. Make sure your `vercel.json` has the correct CORS headers configuration

### 5. MongoDB Connection Issues

**Error Message:**
```
MongoNetworkError: connection timed out
```

**Solution:**
1. Verify your MongoDB Atlas cluster is running
2. Ensure your MongoDB connection string is correct
3. Check that your MongoDB Atlas cluster allows connections from anywhere (0.0.0.0/0)
4. Verify your database user has the correct permissions

### 6. Google OAuth Configuration Issues

**Error Message:**
```
Error 400: redirect_uri_mismatch
```

**Solution:**
1. Ensure your Google Cloud Console configuration is correct:
   - Authorized JavaScript origins: `https://sanjayrajn.vercel.app`
   - Authorized redirect URIs: `https://sanjayrajn.vercel.app/auth/google/callback`
2. Verify your OAuth consent screen is published
3. Check that your Google Client ID and Secret are correctly set in Vercel

## Diagnostic Steps

### 1. Check API Status
Visit: `https://sanjayrajn.vercel.app/api/test/api-status`

This should return:
```json
{
  "success": true,
  "message": "API is working!",
  "timestamp": "2023-06-01T12:00:00.000Z",
  "environment": {
    "nodeVersion": "v18.x.x",
    "hasGoogleClientId": true,
    "hasGoogleClientSecret": true,
    "hasJwtSecret": true,
    "hasMongoUri": true
  }
}
```

### 2. Check Environment Variables
Visit: `https://sanjayrajn.vercel.app/api/debug/env-check`

This should show all environment variables as `true`.

### 3. View Vercel Logs
```bash
vercel logs
```

Look for specific error messages related to your API endpoints.

### 4. Test Locally First
```bash
vercel dev
```

This will run your application locally with the same environment as Vercel.

## Deployment Checklist

- [ ] All environment variables set in Vercel dashboard
- [ ] `vercel.json` configuration is valid (no conflicts)
- [ ] All API files exist and are correctly configured
- [ ] Google Cloud Console configuration is correct
- [ ] MongoDB Atlas cluster is accessible
- [ ] CORS headers are properly configured
- [ ] API endpoints are accessible

## Quick Fixes

### Fix vercel.json Configuration
```bash
# Run the deployment script which can fix common issues
./deploy-vercel.ps1
```

### Redeploy to Vercel
```bash
vercel --prod
```

### Check Deployment Status
```bash
vercel list
```

This will show your recent deployments and their status.