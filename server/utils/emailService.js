const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE || 'gmail',
            host: process.env.EMAIL_HOST || 'smtp.gmail.com',
            port: process.env.EMAIL_PORT || 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
    }

    async sendOTP(email, otp, type = 'verification') {
        const subject = type === 'verification' ? 
            'Email Verification - Portfolio Website' : 
            'Password Reset - Portfolio Website';
            
        const html = this.getOTPTemplate(otp, type);

        const mailOptions = {
            from: `"Portfolio Website" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: subject,
            html: html
        };

        try {
            const result = await this.transporter.sendMail(mailOptions);
            console.log('Email sent successfully:', result.messageId);
            return { success: true, messageId: result.messageId };
        } catch (error) {
            console.error('Email sending failed:', error);
            return { success: false, error: error.message };
        }
    }

    getOTPTemplate(otp, type) {
        const title = type === 'verification' ? 'Verify Your Email' : 'Reset Your Password';
        const message = type === 'verification' ? 
            'Please use the following OTP to verify your email address:' :
            'Please use the following OTP to reset your password:';

        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${title}</title>
            <style>
                body {
                    font-family: 'Arial', sans-serif;
                    background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);
                    margin: 0;
                    padding: 20px;
                    color: #ffffff;
                }
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    background: rgba(30, 30, 50, 0.9);
                    border-radius: 15px;
                    padding: 40px;
                    border: 1px solid rgba(0, 168, 255, 0.3);
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
                }
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                }
                .logo {
                    font-size: 28px;
                    font-weight: bold;
                    color: #00a8ff;
                    margin-bottom: 10px;
                }
                .title {
                    font-size: 24px;
                    margin-bottom: 20px;
                    color: #ffffff;
                }
                .otp-container {
                    text-align: center;
                    margin: 30px 0;
                    padding: 20px;
                    background: rgba(0, 168, 255, 0.1);
                    border-radius: 10px;
                    border: 2px solid rgba(0, 168, 255, 0.3);
                }
                .otp {
                    font-size: 36px;
                    font-weight: bold;
                    color: #00a8ff;
                    letter-spacing: 5px;
                    margin: 10px 0;
                }
                .message {
                    font-size: 16px;
                    line-height: 1.6;
                    margin-bottom: 20px;
                    color: #cccccc;
                }
                .warning {
                    background: rgba(255, 193, 7, 0.1);
                    border: 1px solid rgba(255, 193, 7, 0.3);
                    border-radius: 8px;
                    padding: 15px;
                    margin: 20px 0;
                    font-size: 14px;
                    color: #ffc107;
                }
                .footer {
                    text-align: center;
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                    font-size: 14px;
                    color: #888888;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">SRN Portfolio</div>
                    <h1 class="title">${title}</h1>
                </div>
                
                <p class="message">${message}</p>
                
                <div class="otp-container">
                    <div class="otp">${otp}</div>
                    <p style="margin: 5px 0; color: #888;">This OTP is valid for 10 minutes</p>
                </div>
                
                <div class="warning">
                    <strong>Security Notice:</strong><br>
                    • Never share this OTP with anyone<br>
                    • Our team will never ask for your OTP<br>
                    • If you didn't request this, please ignore this email
                </div>
                
                <div class="footer">
                    <p>This is an automated message from Portfolio Website.<br>
                    Please do not reply to this email.</p>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    async sendContactEmail({ name, email, subject, message }) {
        const html = this.getContactEmailTemplate({ name, email, subject, message });

        const mailOptions = {
            from: `"${name}" <${process.env.EMAIL_USER}>`,
            to: 'sanjayrajnblr@gmail.com',
            replyTo: email,
            subject: `Portfolio Contact: ${subject}`,
            html: html
        };

        try {
            const result = await this.transporter.sendMail(mailOptions);
            console.log('Contact email sent successfully:', result.messageId);
            return { success: true, messageId: result.messageId };
        } catch (error) {
            console.error('Contact email sending failed:', error);
            return { success: false, error: error.message };
        }
    }

    getContactEmailTemplate({ name, email, subject, message }) {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>New Contact Message</title>
            <style>
                body {
                    font-family: 'Arial', sans-serif;
                    background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);
                    margin: 0;
                    padding: 20px;
                    color: #ffffff;
                }
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    background: rgba(30, 30, 50, 0.9);
                    border-radius: 15px;
                    padding: 40px;
                    border: 1px solid rgba(0, 168, 255, 0.3);
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
                }
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                }
                .logo {
                    font-size: 28px;
                    font-weight: bold;
                    color: #00a8ff;
                    margin-bottom: 10px;
                }
                .title {
                    font-size: 24px;
                    margin-bottom: 20px;
                    color: #ffffff;
                }
                .contact-info {
                    background: rgba(0, 168, 255, 0.1);
                    border-radius: 10px;
                    padding: 20px;
                    margin: 20px 0;
                    border: 1px solid rgba(0, 168, 255, 0.3);
                }
                .info-row {
                    display: flex;
                    margin-bottom: 10px;
                    align-items: center;
                }
                .info-label {
                    font-weight: bold;
                    color: #00a8ff;
                    min-width: 80px;
                    margin-right: 10px;
                }
                .info-value {
                    color: #cccccc;
                }
                .message-box {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                    padding: 20px;
                    margin: 20px 0;
                    border-left: 4px solid #00a8ff;
                }
                .message-title {
                    font-size: 18px;
                    font-weight: bold;
                    color: #00a8ff;
                    margin-bottom: 15px;
                }
                .message-content {
                    line-height: 1.6;
                    color: #ffffff;
                    white-space: pre-wrap;
                }
                .footer {
                    text-align: center;
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                    font-size: 14px;
                    color: #888888;
                }
                .reply-note {
                    background: rgba(76, 175, 80, 0.1);
                    border: 1px solid rgba(76, 175, 80, 0.3);
                    border-radius: 8px;
                    padding: 15px;
                    margin: 20px 0;
                    font-size: 14px;
                    color: #4caf50;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">SRN Portfolio</div>
                    <h1 class="title">New Contact Message</h1>
                </div>
                
                <div class="contact-info">
                    <div class="info-row">
                        <span class="info-label">From:</span>
                        <span class="info-value">${name}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Email:</span>
                        <span class="info-value">${email}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Subject:</span>
                        <span class="info-value">${subject}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Date:</span>
                        <span class="info-value">${new Date().toLocaleString()}</span>
                    </div>
                </div>
                
                <div class="message-box">
                    <div class="message-title">Message:</div>
                    <div class="message-content">${message}</div>
                </div>
                
                <div class="reply-note">
                    <strong>📧 Reply Instructions:</strong><br>
                    You can reply directly to this email to respond to ${name}.<br>
                    Their email address (${email}) is set as the reply-to address.
                </div>
                
                <div class="footer">
                    <p>This message was sent from your portfolio contact form.<br>
                    Portfolio Website - Contact Form Submission</p>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    async verifyEmailConfiguration() {
        try {
            await this.transporter.verify();
            console.log('✅ Email service configured successfully');
            return true;
        } catch (error) {
            console.error('❌ Email service configuration failed:', error);
            return false;
        }
    }
}

module.exports = new EmailService();