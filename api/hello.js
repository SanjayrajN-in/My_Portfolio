// Simple API endpoint to test Vercel deployment
export default function handler(req, res) {
  res.status(200).json({
    message: 'Hello from Vercel Serverless Function!',
    timestamp: new Date().toISOString(),
    success: true,
    environment: process.env.NODE_ENV || 'development'
  });
}