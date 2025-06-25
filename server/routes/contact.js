const express = require('express');
const rateLimit = require('express-rate-limit');
const emailService = require('../utils/emailService');

const router = express.Router();

// Rate limiting for contact form
const contactLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // limit each IP to 5 contact submissions per hour
    message: {
        success: false,
        message: 'Too many contact form submissions from this IP, please try again later.'
    }
});

// Contact form submission
router.post('/send', contactLimiter, async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        // Validation
        if (!name || !email || !subject || !message) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address'
            });
        }

        // Send contact email to your Gmail
        const result = await emailService.sendContactEmail({
            name,
            email,
            subject,
            message
        });

        if (result.success) {
            res.json({
                success: true,
                message: 'Your message has been sent successfully! I will get back to you soon.'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to send message. Please try again later.'
            });
        }

    } catch (error) {
        console.error('Contact form error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while sending your message'
        });
    }
});

module.exports = router;