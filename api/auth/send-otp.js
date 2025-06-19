const connectDB = require('../config/database');
const User = require('../models/User');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectDB();

    const { email, type } = req.body; // type: 'register' or 'login'

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    let user;
    
    if (type === 'register') {
      // For registration, check if user already exists
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser && existingUser.isVerified) {
        return res.status(400).json({ 
          message: 'This email is already registered. Please login instead.',
          shouldLogin: true 
        });
      }
      
      if (existingUser && !existingUser.isVerified) {
        // Update existing unverified user
        user = existingUser;
        user.otp = otp;
        user.otpExpires = otpExpires;
        await user.save();
      } else {
        // Create new unverified user
        user = new User({
          email: email.toLowerCase(),
          otp: otp,
          otpExpires: otpExpires,
          isVerified: false,
          name: '', // Will be set during registration completion
          password: '' // Will be set during registration completion
        });
        await user.save();
      }
    } else if (type === 'login') {
      // For login, user must exist and be verified
      user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      if (!user.isVerified) {
        return res.status(400).json({ message: 'Please complete your registration first' });
      }
      
      // Update OTP for login verification
      user.otp = otp;
      user.otpExpires = otpExpires;
      await user.save();
    } else if (type === 'forgot-password') {
      // For forgot password, user must exist and be verified
      user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return res.status(404).json({ message: 'No account found with this email address' });
      }
      if (!user.isVerified) {
        return res.status(400).json({ message: 'Please complete your registration first' });
      }
      
      // Update OTP for password reset
      user.otp = otp;
      user.otpExpires = otpExpires;
      await user.save();
    }

    // Configure email transporter
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Email content based on type
    const emailContent = getEmailContent(otp, type, user.name || 'User');

    // Send OTP email
    await transporter.sendMail({
      from: `"${process.env.APP_NAME || 'Portfolio'}" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: emailContent.subject,
      html: emailContent.html
    });

    res.status(200).json({
      success: true,
      message: `OTP sent to ${email}`,
      expiresIn: '10 minutes'
    });

  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ message: 'Failed to send OTP. Please try again.' });
  }
};

function getEmailContent(otp, type, userName) {
  const isRegistration = type === 'register';
  const isLogin = type === 'login';
  const isForgotPassword = type === 'forgot-password';
  
  let subject, title, message;
  
  if (isRegistration) {
    subject = '🔐 Verify Your Email - Complete Registration';
    title = 'Welcome! Verify Your Email';
    message = 'Thank you for joining us! Please verify your email address to complete your registration.';
  } else if (isLogin) {
    subject = '🔐 Login Verification Code';
    title = 'Login Verification';
    message = `Hello ${userName}! Please verify your identity to continue with login.`;
  } else if (isForgotPassword) {
    subject = '🔑 Password Reset Verification';
    title = 'Reset Your Password';
    message = `Hello ${userName}! We received a request to reset your password. Please use the verification code below to proceed.`;
  }

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                line-height: 1.6;
                color: #333;
                background-color: #f8f9fa;
            }
            
            .container {
                max-width: 600px;
                margin: 0 auto;
                background: white;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            }
            
            .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 40px 30px;
                text-align: center;
            }
            
            .header h1 {
                font-size: 28px;
                font-weight: 600;
                margin-bottom: 10px;
            }
            
            .header p {
                font-size: 16px;
                opacity: 0.9;
            }
            
            .content {
                padding: 40px 30px;
                text-align: center;
            }
            
            .message {
                font-size: 16px;
                color: #666;
                margin-bottom: 30px;
                line-height: 1.7;
            }
            
            .otp-container {
                background: #f8f9ff;
                border: 2px dashed #667eea;
                border-radius: 12px;
                padding: 30px;
                margin: 30px 0;
            }
            
            .otp-label {
                font-size: 14px;
                color: #666;
                margin-bottom: 10px;
                text-transform: uppercase;
                letter-spacing: 1px;
                font-weight: 600;
            }
            
            .otp-code {
                font-size: 36px;
                font-weight: 700;
                color: #667eea;
                letter-spacing: 8px;
                font-family: 'Courier New', monospace;
                margin: 10px 0;
            }
            
            .otp-note {
                font-size: 14px;
                color: #999;
                margin-top: 15px;
            }
            
            .warning {
                background: #fff3cd;
                border: 1px solid #ffeaa7;
                border-radius: 8px;
                padding: 20px;
                margin: 30px 0;
                color: #856404;
            }
            
            .warning-title {
                font-weight: 600;
                margin-bottom: 8px;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .footer {
                background: #f8f9fa;
                padding: 30px;
                text-align: center;
                border-top: 1px solid #e9ecef;
            }
            
            .footer p {
                font-size: 14px;
                color: #666;
                margin-bottom: 10px;
            }
            
            .footer a {
                color: #667eea;
                text-decoration: none;
            }
            
            .footer a:hover {
                text-decoration: underline;
            }
            
            .brand {
                font-weight: 600;
                color: #667eea;
            }
            
            @media (max-width: 600px) {
                .container {
                    margin: 0;
                    border-radius: 0;
                }
                
                .header, .content, .footer {
                    padding: 30px 20px;
                }
                
                .otp-code {
                    font-size: 28px;
                    letter-spacing: 4px;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔐 ${title}</h1>
                <p>Secure verification for your account</p>
            </div>
            
            <div class="content">
                <p class="message">
                    ${message}
                </p>
                
                <div class="otp-container">
                    <div class="otp-label">Your Verification Code</div>
                    <div class="otp-code">${otp}</div>
                    <div class="otp-note">
                        ⏰ This code expires in <strong>10 minutes</strong>
                    </div>
                </div>
                
                <div class="warning">
                    <div class="warning-title">
                        ⚠️ Security Notice
                    </div>
                    <p>
                        Never share this code with anyone. Our team will never ask for your verification code.
                        If you didn't request this code, please ignore this email.
                    </p>
                </div>
            </div>
            
            <div class="footer">
                <p>
                    This email was sent from <span class="brand">Sanjayraj Portfolio</span>
                </p>
                <p>
                    Having trouble? Contact us at 
                    <a href="mailto:${process.env.EMAIL_USER}">${process.env.EMAIL_USER}</a>
                </p>
                <p style="margin-top: 20px; font-size: 12px; color: #999;">
                    © ${new Date().getFullYear()} Sanjayraj Portfolio. All rights reserved.
                </p>
            </div>
        </div>
    </body>
    </html>
  `;

  return { subject, html };
}