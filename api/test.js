// Simple API test endpoint
module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle preflight
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    // Return simple test response
    res.json({
        success: true,
        message: 'API is working!',
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.url,
        environment: {
            nodeVersion: process.version,
            platform: process.platform,
            hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
            vercelEnv: process.env.VERCEL_ENV || 'local'
        }
    });
};