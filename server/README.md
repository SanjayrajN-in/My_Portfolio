# Portfolio Backend Setup

## Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud)
- Gmail account for email service

## Installation

1. Install dependencies:
```bash
cd server
npm install
```

2. Setup MongoDB:
   - Install MongoDB locally OR use MongoDB Atlas (cloud)
   - Make sure MongoDB is running on `mongodb://localhost:27017/portfolio`

3. Configure Email Service:
   - Open `.env` file
   - Replace email settings:
   ```
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   ```
   
   **To get Gmail App Password:**
   - Go to Google Account Settings
   - Enable 2-Factor Authentication
   - Generate App Password for "Mail"
   - Use that password in EMAIL_PASS

4. Configure JWT Secret:
   - Replace `JWT_SECRET` in `.env` with a strong random string

5. Start the server:
```bash
npm run dev    # For development with auto-restart
# OR
npm start      # For production
```

## API Endpoints

### Authentication
- `POST /api/auth/send-otp` - Send OTP for registration/password reset
- `POST /api/auth/register` - Register with OTP verification
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/verify-otp` - Verify OTP
- `POST /api/auth/reset-password` - Reset password with OTP

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (@$!%*?&)

### Security Features
- Rate limiting on auth routes
- Account lockout after failed attempts
- OTP expiration (10 minutes)
- Password hashing with bcrypt
- JWT token authentication
- Input validation and sanitization

## Testing

1. Start the server: `npm run dev`
2. Server will run on `http://localhost:3000`
3. Test with: `curl http://localhost:3000/api/health`

## Production Deployment

1. Set production environment variables
2. Use a production MongoDB instance
3. Configure proper CORS origins
4. Use process manager like PM2
5. Setup SSL/HTTPS
6. Configure firewall and security

## Database Schema

### User Model
- name: String (required, 2-50 chars)
- email: String (required, unique, validated)
- password: String (required, hashed, validated)
- avatar: String (optional)
- isEmailVerified: Boolean
- emailVerificationOTP: { code, expiresAt }
- passwordResetOTP: { code, expiresAt }
- loginAttempts: Number
- lockUntil: Date
- lastLogin: Date
- joinedDate: Date
- gameStats: Object