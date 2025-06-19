# 🚀 Deploy Frontend to Vercel

## Quick Deployment Steps

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Deploy from Frontend Folder
```bash
cd frontend
vercel
```

### 3. Follow the Prompts
- **Set up and deploy?** Y
- **Which scope?** (Choose your account)
- **Link to existing project?** N
- **Project name:** sanjay-portfolio (or your choice)
- **In which directory?** ./ (current directory)
- **Want to override settings?** N

### 4. Update Backend URL
After your backend is deployed to Render:

1. **Get your Render backend URL** (e.g., `https://sanjay-backend.onrender.com`)
2. **Update these files:**
   - `js/auth.js` - Line 2: Change `API_BASE_URL`
   - `js/api-config.js` - Line 9: Update `baseURL`

3. **Redeploy:**
   ```bash
   vercel --prod
   ```

## ✅ After Deployment

1. **Your frontend will be live at:** `https://your-project.vercel.app`
2. **Update backend CORS:** Add your Vercel URL to server CORS settings
3. **Test authentication:** Try login/register on your live site

## 🔧 Alternative: Deploy via GitHub

1. **Push frontend folder to GitHub**
2. **Connect Vercel to GitHub**
3. **Auto-deploy on commits**

## 📁 What Gets Deployed

```
frontend/
├── index.html          # Homepage
├── pages/              # All pages (about, contact, etc.)
├── css/               # Stylesheets  
├── js/                # JavaScript (auth, games, etc.)
├── images/            # All images and assets
└── audio/             # Music keyboard sounds
```

## 🎯 Final URLs Structure

- **Frontend (Vercel):** `https://your-portfolio.vercel.app`
- **Backend (Render):** `https://your-backend.onrender.com`
- **API Endpoints:** `https://your-backend.onrender.com/api/auth/login`