# 🚀 Infinity Hole Deployment Guide

## Overview
This guide will help you deploy your Infinity Hole application to the internet so people can access it from anywhere.

## Prerequisites
- GitHub account
- Vercel account (free)
- Railway account (free)

## Step 1: Deploy Frontend to Vercel

### 1.1 Go to Vercel
1. Visit [vercel.com](https://vercel.com)
2. Sign up/Login with your GitHub account

### 1.2 Import Project
1. Click "New Project"
2. Import from GitHub: `Thecodingpm/InfinityHole`
3. Configure the project:
   - **Framework Preset:** Next.js
   - **Root Directory:** `frontend-web`
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`

### 1.3 Environment Variables
Add these environment variables in Vercel:
- `NEXT_PUBLIC_API_URL` = `https://your-backend-url.railway.app` (you'll get this after deploying backend)

### 1.4 Deploy
Click "Deploy" and wait for deployment to complete.

## Step 2: Deploy Backend to Railway

### 2.1 Go to Railway
1. Visit [railway.app](https://railway.app)
2. Sign up with your GitHub account

### 2.2 Create New Project
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your repository: `Thecodingpm/InfinityHole`

### 2.3 Configure Backend
1. Set **Root Directory** to `backend`
2. Railway will automatically detect Python and install dependencies

### 2.4 Environment Variables
Add these environment variables in Railway:
- `PORT` = `8000`
- Add your Firebase configuration if needed

### 2.5 Deploy
Railway will automatically deploy your backend.

## Step 3: Connect Frontend to Backend

### 3.1 Get Backend URL
1. Go to your Railway project
2. Copy the generated URL (e.g., `https://infinity-hole-backend-production.railway.app`)

### 3.2 Update Frontend
1. Go to your Vercel project
2. Go to Settings → Environment Variables
3. Update `NEXT_PUBLIC_API_URL` with your Railway backend URL
4. Redeploy the frontend

## Step 4: Test Your Deployment

### 4.1 Test Frontend
1. Visit your Vercel URL
2. You should see the beautiful landing page
3. Click "Use Website" to access the app

### 4.2 Test Backend
1. Visit `https://your-backend-url.railway.app/health`
2. You should see a health check response

### 4.3 Test Full Flow
1. Try downloading a video from the deployed website
2. Make sure everything works end-to-end

## Step 5: Custom Domain (Optional)

### 5.1 Add Custom Domain to Vercel
1. Go to your Vercel project
2. Go to Settings → Domains
3. Add your custom domain
4. Follow the DNS configuration instructions

### 5.2 Add Custom Domain to Railway
1. Go to your Railway project
2. Go to Settings → Domains
3. Add your custom domain
4. Configure DNS records

## Troubleshooting

### Common Issues:

1. **Frontend can't connect to backend**
   - Check if `NEXT_PUBLIC_API_URL` is set correctly
   - Make sure backend is deployed and running
   - Check Railway logs for errors

2. **Backend deployment fails**
   - Check if all dependencies are in `requirements.txt`
   - Make sure Python version is compatible
   - Check Railway build logs

3. **CORS errors**
   - Backend should handle CORS properly
   - Check if frontend URL is allowed in backend CORS settings

## Cost
- **Vercel:** Free tier includes 100GB bandwidth/month
- **Railway:** Free tier includes $5 credit/month
- **Total:** Completely free for small to medium usage

## Security Notes
- Never commit API keys or secrets to GitHub
- Use environment variables for all sensitive data
- Enable HTTPS for both frontend and backend
- Consider adding rate limiting for production use

## Monitoring
- Vercel provides analytics and performance monitoring
- Railway provides logs and metrics
- Set up error tracking (Sentry) for production

## Next Steps
1. Set up monitoring and alerts
2. Configure automatic deployments from GitHub
3. Add custom domain
4. Set up SSL certificates
5. Configure CDN for better performance

---

**Your app will be live at:** `https://your-project-name.vercel.app`
**Backend API:** `https://your-backend-name.railway.app`

Happy deploying! 🎉
