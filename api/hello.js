// Simple API endpoint to test Vercel deployment
module.exports = (req, res) => {
  res.status(200).json({
    message: 'Hello from Vercel Serverless Function!',
    timestamp: new Date().toISOString(),
    success: true
  });
};