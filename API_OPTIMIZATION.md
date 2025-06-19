# API Optimization for Vercel Deployment

## Overview

This document explains the optimization made to reduce the number of serverless functions to stay within Vercel's Hobby plan limit of 12 functions.

## Changes Made

### 1. Consolidated API Handlers

We've consolidated multiple API endpoints into a few main handler files:

- **api/auth.js**: Handles all authentication-related endpoints
  - `/api/auth/google` - Google OAuth authentication
  - `/api/auth/login` - Email/password login
  - `/api/auth/register` - User registration
  - `/api/auth/send-otp` - Send verification codes
  - `/api/auth/verify-otp` - Verify OTP codes

- **api/contact-user.js**: Handles contact form and user data
  - `/api/contact/submit` - Contact form submission
  - `/api/users/update-game-stats` - Update user game statistics

- **api/utils.js**: Handles utility endpoints
  - `/api/hello` - Simple hello world endpoint
  - `/api/test` - API test endpoint
  - `/api/db-test` - Database connection test

### 2. Updated Routing in vercel.json

We've updated the routing configuration to direct requests to the appropriate consolidated handlers:

```json
"rewrites": [
  { "source": "/api/auth/:endpoint", "destination": "/api/auth?endpoint=:endpoint" },
  { "source": "/api/contact/:endpoint", "destination": "/api/contact-user?endpoint=:endpoint" },
  { "source": "/api/users/:endpoint", "destination": "/api/contact-user?endpoint=:endpoint" },
  { "source": "/api/:endpoint", "destination": "/api/utils?endpoint=:endpoint" },
  { "source": "/auth/google/callback", "destination": "/auth/google/callback.html" }
]
```

### 3. Consistent Module System

All API files now use ES modules (import/export) consistently as specified in package.json with `"type": "module"`.

## Benefits

1. **Reduced Function Count**: Stays within Vercel's Hobby plan limit of 12 serverless functions
2. **Improved Maintainability**: Related functionality is grouped together
3. **Consistent Error Handling**: Centralized error handling and CORS configuration
4. **No Frontend Changes Required**: The API URLs remain the same from the frontend perspective

## Deployment Notes

- The frontend code doesn't need to change as the API URLs remain the same
- All API functionality remains intact
- Error handling has been improved throughout the codebase

## Troubleshooting

If you encounter any issues:

1. Check the browser console for detailed error messages
2. Use the `/api/test` endpoint to verify basic API functionality
3. Use the `/api/db-test` endpoint to verify database connectivity
4. Check Vercel logs for any server-side errors