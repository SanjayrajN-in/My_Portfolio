# Portfolio Frontend

This is the frontend of your portfolio website - all the HTML, CSS, JS files.

## Deployment to Vercel

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy from this frontend folder:**
   ```bash
   cd frontend
   vercel
   ```

3. **Follow the prompts:**
   - Link to existing project? **N**
   - Project name: **your-portfolio**
   - Deploy? **Y**

## Important Configuration

Before deploying, update the backend URL in:
- `js/auth.js` - Line 2: `API_BASE_URL`
- `js/api-config.js` - Line 9: `baseURL`

Replace `https://your-backend-app.onrender.com` with your actual Render backend URL.

## Files Structure
```
frontend/
├── index.html          # Main homepage
├── pages/              # All other pages
├── css/               # Stylesheets
├── js/                # JavaScript files
├── images/            # Images and assets
└── audio/             # Audio files
```

## After Deployment
1. Get your Vercel frontend URL (e.g., `https://your-portfolio.vercel.app`)
2. Update the CORS settings in your backend server to allow this domain
3. Test the authentication system