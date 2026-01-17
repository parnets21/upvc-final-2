const express = require('express');
const path = require('path');
const fs = require('fs');
const { toAbsoluteUrl } = require('../utils/urlHelper');

const router = express.Router();

// Test endpoint to check video serving
router.get('/videos', (req, res) => {
  try {
    const uploadsDir = path.join(__dirname, '../uploads');
    const videoDir = path.join(uploadsDir, 'video');
    
    let videoFiles = [];
    
    if (fs.existsSync(videoDir)) {
      videoFiles = fs.readdirSync(videoDir)
        .filter(file => file.endsWith('.mp4') || file.endsWith('.mov'))
        .map(file => ({
          filename: file,
          relativePath: `uploads/video/${file}`,
          absoluteUrl: toAbsoluteUrl(`uploads/video/${file}`),
          exists: fs.existsSync(path.join(videoDir, file))
        }));
    }
    
    res.json({
      message: 'Video test endpoint',
      baseUrl: process.env.BASE_URL || 'http://localhost:9000',
      videoCount: videoFiles.length,
      videos: videoFiles,
      testUrls: videoFiles.slice(0, 3).map(video => video.absoluteUrl)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test categories endpoint
router.get('/categories', async (req, res) => {
  try {
    const Category = require('../models/Admin/Category');
    const categories = await Category.find().limit(5);
    
    const categoriesWithAbsoluteUrls = categories.map(cat => {
      const categoryObj = cat.toObject();
      
      // Fix videoUrl (legacy field) if it exists
      if (categoryObj.videoUrl) {
        categoryObj.videoUrl = toAbsoluteUrl(categoryObj.videoUrl);
      }
      
      // Fix videos array URLs
      if (categoryObj.videos && categoryObj.videos.length > 0) {
        categoryObj.videos = categoryObj.videos.map(video => ({
          ...video,
          videoUrl: toAbsoluteUrl(video.videoUrl),
          sponsorLogo: video.sponsorLogo ? toAbsoluteUrl(video.sponsorLogo) : null
        }));
      }
      
      return categoryObj;
    });
    
    res.json({
      message: 'Category test endpoint',
      baseUrl: process.env.BASE_URL || 'http://localhost:9000',
      categoryCount: categoriesWithAbsoluteUrls.length,
      categories: categoriesWithAbsoluteUrls
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test a specific video file
router.get('/video/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const videoPath = path.join(__dirname, '../uploads/video', filename);
    
    if (!fs.existsSync(videoPath)) {
      return res.status(404).json({ error: 'Video file not found' });
    }
    
    const stats = fs.statSync(videoPath);
    
    res.json({
      filename,
      exists: true,
      size: stats.size,
      relativePath: `uploads/video/${filename}`,
      absoluteUrl: toAbsoluteUrl(`uploads/video/${filename}`),
      directAccessUrl: `${req.protocol}://${req.get('host')}/uploads/video/${filename}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;