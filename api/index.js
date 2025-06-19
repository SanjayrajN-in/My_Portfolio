// API Root Handler
export default function handler(req, res) {
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
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // Return API info
  res.status(200).json({
    name: "Sanjayraj Portfolio API",
    version: "1.0.0",
    endpoints: [
      "/api/auth/google",
      "/api/auth/login",
      "/api/auth/register",
      "/api/auth/send-otp",
      "/api/auth/verify-otp",
      "/api/contact/submit",
      "/api/users/update-game-stats",
      "/api/hello",
      "/api/test",
      "/api/db-test"
    ],
    documentation: "See API_OPTIMIZATION.md for details",
    timestamp: new Date().toISOString()
  });
}