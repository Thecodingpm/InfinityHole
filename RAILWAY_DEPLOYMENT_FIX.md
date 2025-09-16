# 🚂 Railway Deployment Fix

## Problem
Railway was trying to build from the root directory instead of the `backend/` folder, causing the Nixpacks build to fail.

## Solution
I've created multiple configuration files to tell Railway how to properly deploy your backend:

### Files Created:
1. **`railway.json`** - Railway-specific configuration
2. **`nixpacks.toml`** - Nixpacks build configuration  
3. **`Procfile`** - Process file for Railway

## How to Fix Railway Deployment:

### Option 1: Use Railway Dashboard (Recommended)
1. **Go to your Railway project dashboard**
2. **Go to Settings → Deploy**
3. **Set the following:**
   - **Root Directory:** `backend`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `python main.py`

### Option 2: Redeploy with New Configuration
1. **Delete your current Railway deployment**
2. **Create a new project**
3. **Select "Deploy from GitHub repo"**
4. **Choose your repository:** `Thecodingpm/InfinityHole`
5. **Set Root Directory to:** `backend`
6. **Deploy**

### Option 3: Use Railway CLI
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Link to your project
railway link

# Set root directory
railway variables set RAILWAY_ROOT_DIRECTORY=backend

# Deploy
railway up
```

## Environment Variables to Set in Railway:
- `PORT` = `8000`
- `PYTHON_VERSION` = `3.11` (or latest)
- Add your Firebase configuration if needed

## Alternative: Use Render.com
If Railway continues to have issues, you can use Render.com instead:

1. **Go to [render.com](https://render.com)**
2. **Sign up with GitHub**
3. **Create "Web Service"**
4. **Connect your repository**
5. **Configure:**
   - **Root Directory:** `backend`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `python main.py`
   - **Environment:** `Python 3`

## Test Your Deployment:
Once deployed, test these endpoints:
- `https://your-app.railway.app/health` - Health check
- `https://your-app.railway.app/extract` - Video extraction (POST)

## Update Frontend:
After getting your backend URL, update your Vercel environment variable:
- `NEXT_PUBLIC_API_URL` = `https://your-backend.railway.app`

## Troubleshooting:
- **Build fails:** Check if `requirements.txt` exists in backend folder
- **Python not found:** Set `PYTHON_VERSION` environment variable
- **Port issues:** Make sure your app listens on `PORT` environment variable
- **Dependencies fail:** Check if all packages in `requirements.txt` are available

## Quick Fix Commands:
```bash
# Commit the new configuration files
git add .
git commit -m "Fix Railway deployment configuration"
git push origin main

# Then redeploy in Railway dashboard
```
