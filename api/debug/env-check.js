// Environment Variables Debug Endpoint
module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle preflight
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    // Only allow GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({
            success: false,
            message: 'Method not allowed'
        });
    }
    
    // Check environment variables (without exposing sensitive data)
    const envCheck = {
        success: true,
        message: 'Environment check completed',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        platform: process.platform,
        nodeVersion: process.version,
        variables: {
            GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
            GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
            JWT_SECRET: !!process.env.JWT_SECRET,
            MONGODB_URI: !!process.env.MONGODB_URI,
            VERCEL: !!process.env.VERCEL,
            VERCEL_ENV: process.env.VERCEL_ENV || 'not-set'
        },
        // Show partial values for debugging (first 10 chars only)
        partialValues: {
            GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? 
                process.env.GOOGLE_CLIENT_ID.substring(0, 10) + '...' : 'not-set',
            JWT_SECRET: process.env.JWT_SECRET ? 
                process.env.JWT_SECRET.substring(0, 10) + '...' : 'not-set'
        }
    };
    
    res.json(envCheck);
};