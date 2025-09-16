# Multi-Storage System Setup Guide

## Overview

Your video downloader now supports **automatic failover between multiple storage providers**! When one storage service reaches its limit, the system automatically switches to the next available provider.

## Storage Providers (in priority order)

### 1. **Firebase Storage** (Primary)
- **Free Tier**: 100MB
- **Best for**: Fast uploads, reliable service
- **Setup**: Requires Firebase service account key

### 2. **Cloudinary** (Backup)
- **Free Tier**: 25MB
- **Best for**: Image/video optimization, CDN delivery
- **Setup**: Requires Cloudinary account

### 3. **Local Storage** (Fallback)
- **Free Tier**: 1GB (local disk)
- **Best for**: Development, unlimited storage
- **Setup**: No configuration needed

## How It Works

```
User uploads file → Firebase Storage (100MB limit)
                    ↓ (if full)
                 Cloudinary (25MB limit)
                    ↓ (if full)
                 Local Storage (1GB limit)
```

## Setup Instructions

### 1. Firebase Storage Setup

1. **Go to [Firebase Console](https://console.firebase.google.com/)**
2. **Select your project**: `infinityhole-e4e92`
3. **Go to "Storage"** in the left sidebar
4. **Click "Get started"**
5. **Choose "Start in test mode"** (for development)
6. **Download service account key**:
   - Go to Project Settings → Service Accounts
   - Click "Generate new private key"
   - Save as `firebase-service-account.json` in your backend directory

### 2. Cloudinary Setup (Optional but Recommended)

1. **Go to [Cloudinary](https://cloudinary.com/)**
2. **Sign up for free account**
3. **Get your credentials** from the dashboard:
   - Cloud Name
   - API Key
   - API Secret

### 3. Environment Configuration

Create a `.env` file in your backend directory:

```bash
# Firebase Configuration
FIREBASE_PROJECT_ID=infinityhole-e4e92
FIREBASE_STORAGE_BUCKET=infinityhole-e4e92.firebasestorage.app

# Cloudinary Configuration (Optional)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Storage Limits
FIREBASE_FREE_TIER_MB=100
CLOUDINARY_FREE_TIER_MB=25
LOCAL_STORAGE_LIMIT_MB=1000
AD_BONUS_STORAGE_MB=10
```

### 4. Install Dependencies

```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
```

## Features

### ✅ **Automatic Failover**
- When Firebase Storage is full → automatically uses Cloudinary
- When Cloudinary is full → automatically uses Local Storage
- Seamless user experience

### ✅ **Storage Expansion**
- Watch ads to get +10MB per ad
- Up to 10 ads = +100MB total bonus
- Works across all storage providers

### ✅ **Provider Status**
- Real-time monitoring of storage availability
- Automatic switching when providers go down
- Fallback to local storage if all cloud providers fail

### ✅ **File Management**
- List files across all providers
- Delete files from any provider
- Unified file listing interface

## API Endpoints

### Get Storage Info
```http
GET /cloud/storage
```
Returns current provider, usage, and limits.

### List Files
```http
GET /cloud/files
```
Lists all files across all storage providers.

### Upload File
```http
POST /cloud/upload
```
Uploads to the best available storage provider.

### Watch Ad
```http
POST /cloud/watch-ad
```
Increases storage quota by 10MB.

### Delete File
```http
DELETE /cloud/files/{file_id}
```
Deletes file from the appropriate storage provider.

## Storage Limits

| Provider | Free Tier | With Ads (10 max) | Total Possible |
|----------|-----------|-------------------|----------------|
| Firebase | 100MB | +100MB | 200MB |
| Cloudinary | 25MB | +100MB | 125MB |
| Local | 1GB | +100MB | 1.1GB |
| **Combined** | **1.125GB** | **+300MB** | **1.425GB** |

## Troubleshooting

### Firebase Storage Issues
- Check service account key is in backend directory
- Verify Firebase project ID matches
- Ensure Storage is enabled in Firebase Console

### Cloudinary Issues
- Verify API credentials in .env file
- Check Cloudinary account is active
- Ensure proper permissions

### Local Storage Issues
- Check disk space availability
- Verify write permissions to backend directory

## Production Recommendations

1. **Set up proper Firebase security rules**
2. **Use Cloudinary for production** (better CDN)
3. **Monitor storage usage** across providers
4. **Set up alerts** for storage limits
5. **Consider paid tiers** for high usage

## Benefits

- **No single point of failure**
- **Cost-effective** (uses free tiers efficiently)
- **Scalable** (easy to add more providers)
- **User-friendly** (automatic switching)
- **Reliable** (always has fallback storage)

Your users will never run out of storage space again! 🚀

