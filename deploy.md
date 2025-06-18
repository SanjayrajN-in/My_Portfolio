# Deployment Guide for Vercel

## Issues Fixed:
1. ✅ Fixed missing `<` in DOCTYPE declarations across all HTML files
2. ✅ Updated vercel.json for proper static site routing
3. ✅ Added .vercelignore to exclude unnecessary files
4. ✅ Configured proper MIME types for CSS/JS files

## File Structure:
```
/
├── index.html (main entry point)
├── pages/
│   ├── about.html
│   ├── contact.html
│   ├── projects.html
│   └── ... (other pages)
├── css/
│   ├── styles.css
│   └── ... (other stylesheets)
├── js/
│   ├── script.js
│   └── ... (other scripts)
├── images/
├── api/ (serverless functions)
└── vercel.json (deployment config)
```

## Deployment Steps:
1. Commit all changes to your repository
2. Push to GitHub/GitLab
3. Connect repository to Vercel
4. Deploy automatically

## Vercel Configuration:
- Static files are served from root
- API routes are handled by serverless functions
- Proper caching headers for assets
- CORS headers for API endpoints

## Testing Locally:
```bash
# Install Vercel CLI
npm i -g vercel

# Run local development server
vercel dev
```

## Common Issues & Solutions:
1. **CSS not loading**: Check file paths are relative to HTML file location
2. **Pages not found**: Ensure all HTML files have proper DOCTYPE
3. **API not working**: Check api/ folder structure and function exports
4. **Fonts not loading**: CDN links should work, check network tab in DevTools