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

5. **Fixed Category Controller** (`controllers/Admin/categoryController.js`)
   - Updated to use centralized URL helper
   - Returns absolute URLs for category videos and sponsor logos
   - Fixes both legacy videoUrl field and videos array

6. **Fixed SubCategory Controller** (`controllers/Admin/subCategoryController.js`)
   - Updated to use centralized URL helper
   - Returns absolute URLs for subcategory videos

7. **Updated Buyer Auth Controller** (`controllers/Buyer/authController.js`)
   - Replaced local toAbsoluteUrl function with centralized helper
   - Ensures consistent URL handling across all endpoints

8. **Added Test Endpoints** (`routes/test.js`)
   - `/test/videos` - Lists all videos with URLs
   - `/test/video/:filename` - Tests specific video file
   - `/test/categories` - Tests category video URLs

## Deployment Steps

### 1. Push Changes to Git
```bash
git add .
git commit -m "Fix category video serving with absolute URLs and centralized URL helper"
git push origin main
```

### 2. Update Environment Variables on Render/AWS
Add these environment variables to your deployment:
- `BASE_URL=https://upvcconnect.com`
- `NODE_ENV=production`

### 3. Test After Deployment
Visit these URLs to test:
- `https://upvcconnect.com/test/videos`
- `https://upvcconnect.com/test/categories`
- `https://upvcconnect.com/api/categories`
- `https://upvcconnect.com/uploads/video/[filename].mp4`

### 4. Update Frontend (if needed)
The API now returns absolute URLs, so your frontend should work without changes.

## Specific Category Video Fixes

The main issue was that category videos were not being converted to absolute URLs. Fixed:

1. **Category API** (`/api/categories`) - Now returns absolute URLs for:
   - `videoUrl` (legacy field)
   - `videos[].videoUrl` (new videos array)
   - `videos[].sponsorLogo` (sponsor logos)

2. **SubCategory API** (`/api/subcategories`) - Now returns absolute URLs for:
   - `videoUrl` field

3. **Buyer Leads API** - Already had URL conversion, now uses centralized helper

## Troubleshooting

If videos still don't work:

1. **Check the test endpoints**: 
   - Visit `/test/categories` to see category video URLs
   - Visit `/test/videos` to see if files exist
2. **Verify CORS**: Check browser console for CORS errors
3. **Check file permissions**: Ensure uploads directory is readable
4. **Verify BASE_URL**: Make sure it matches your actual domain

## Quick Test Commands

```bash
# Test category video URLs
curl https://upvcconnect.com/test/categories

# Test video listing
curl https://upvcconnect.com/test/videos

# Test category API
curl https://upvcconnect.com/api/categories

# Test direct video access
curl -I https://upvcconnect.com/uploads/video/[filename].mp4
```