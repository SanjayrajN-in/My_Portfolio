// Redirect to the main auth.js handler with endpoint=google
import { handleGoogleAuth } from './auth';

export default async function handler(req, res) {
  console.log('🔄 Redirecting from /api/google-auth to auth.js with endpoint=google');
  
  // Set CORS headers
  const allowedOrigins = [
    'https://sanjayrajn.vercel.app',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'https://sanjayrajn.vercel.app');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Cache-Control');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');
  res.setHeader('Vary', 'Origin');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  try {
    // Forward to the main Google auth handler
    return handleGoogleAuth(req, res);
  } catch (error) {
    console.error('Error in google-auth.js redirect:', error);
    res.status(500).json({
      success: false,
      message: 'Error in Google auth redirect',
      error: error.message
    });
  }
}