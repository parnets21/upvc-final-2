# Video Serving Fix Deployment Guide

## Changes Made

1. **Added URL Helper Utility** (`utils/urlHelper.js`)
   - Converts relative paths to absolute URLs
   - Normalizes file paths consistently
   - Uses BASE_URL environment variable

2. **Updated Environment Variables** (`.env`)
   - Added `BASE_URL=https://upvc-backend-oh6m.onrender.com`
   - Added `NODE_ENV=production`

3. **Enhanced Static File Serving** (`app.js`)
   - Better CORS headers for video files
   - Proper cache headers
   - Support for .mov files

4. **Updated Pricing Controller** (`controllers/Admin/pricingController.js`)
   - Now returns absolute URLs instead of relative paths
   - Uses centralized URL helper

5. **Added Test Endpoints** (`routes/test.js`)
   - `/test/videos` - Lists all videos with URLs
   - `/test/video/:filename` - Tests specific video file

## Deployment Steps

### 1. Push Changes to Git
```bash
git add .
git commit -m "Fix video serving with absolute URLs and better CORS headers"
git push origin main
```

### 2. Update Environment Variables on Render/AWS
Add these environment variables to your deployment:
- `BASE_URL=https://upvc-backend-oh6m.onrender.com`
- `NODE_ENV=production`

### 3. Test After Deployment
Visit these URLs to test:
- `https://upvc-backend-oh6m.onrender.com/test/videos`
- `https://upvc-backend-oh6m.onrender.com/uploads/video/[filename].mp4`

### 4. Update Frontend (if needed)
The API now returns absolute URLs, so your frontend should work without changes.

## Troubleshooting

If videos still don't work:

1. **Check the test endpoint**: Visit `/test/videos` to see if files exist
2. **Verify CORS**: Check browser console for CORS errors
3. **Check file permissions**: Ensure uploads directory is readable
4. **Verify BASE_URL**: Make sure it matches your actual domain

## Quick Test Commands

```bash
# Test video listing
curl https://upvc-backend-oh6m.onrender.com/test/videos

# Test direct video access
curl -I https://upvc-backend-oh6m.onrender.com/uploads/video/[filename].mp4

# Test API endpoint
curl https://upvc-backend-oh6m.onrender.com/api/pricing/video
```