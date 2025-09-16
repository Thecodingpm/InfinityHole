# 🚀 Render.com Deployment Guide

## Why Render.com?
- ✅ **100% Free** for web services
- ✅ **750 hours/month** (enough for 24/7)
- ✅ **Easy GitHub integration**
- ✅ **Automatic deployments**
- ✅ **No credit card required**

## Step-by-Step Deployment:

### 1. Go to Render.com
1. **Visit [render.com](https://render.com)**
2. **Sign up with your GitHub account**
3. **Verify your email**

### 2. Create New Web Service
1. **Click "New +"**
2. **Select "Web Service"**
3. **Connect your GitHub repository: `Thecodingpm/InfinityHole`**

### 3. Configure Your Service
**Basic Settings:**
- **Name:** `infinity-hole-backend`
- **Environment:** `Python 3`
- **Region:** `Oregon (US West)` or closest to you
- **Branch:** `main`

**Build & Deploy:**
- **Root Directory:** `backend`
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `python main_simple.py`

**Advanced Settings:**
- **Auto-Deploy:** `Yes` (deploys automatically when you push to GitHub)
- **Health Check Path:** `/health`

### 4. Environment Variables (Optional)
Add these if needed:
- `PORT` = `8000`
- `HOST` = `0.0.0.0`

### 5. Deploy
1. **Click "Create Web Service"**
2. **Wait for deployment** (usually 2-5 minutes)
3. **Get your URL** (e.g., `https://infinity-hole-backend.onrender.com`)

## What Happens:
1. **Render clones your GitHub repo**
2. **Installs Python dependencies**
3. **Starts your backend**
4. **Health check passes**
5. **Your API is live!**

## Test Your Deployment:
Once deployed, test these endpoints:
- `https://your-app.onrender.com/health` - Should return `{"status": "healthy"}`
- `https://your-app.onrender.com/` - Should return API info

## Update Frontend:
After getting your Render URL:
1. **Go to Vercel dashboard**
2. **Settings → Environment Variables**
3. **Set `NEXT_PUBLIC_API_URL` = your Render URL**
4. **Redeploy Vercel**

## Render.com Free Tier Limits:
- **750 hours/month** (enough for 24/7)
- **512 MB RAM**
- **0.1 CPU**
- **Sleeps after 15 minutes of inactivity** (wakes up when accessed)

## Pro Tips:
- **First request after sleep takes ~30 seconds** (cold start)
- **Subsequent requests are fast**
- **Perfect for personal projects**

## Troubleshooting:
- **Build fails?** Check if `requirements.txt` exists in backend folder
- **Health check fails?** Make sure `/health` endpoint returns 200
- **App crashes?** Check Render logs for errors

## Alternative: Fly.io
If Render doesn't work:
1. **Go to [fly.io](https://fly.io)**
2. **Sign up with GitHub**
3. **Create new app**
4. **Deploy from GitHub**

---

**Your backend will be live in about 5 minutes!** 🎉
