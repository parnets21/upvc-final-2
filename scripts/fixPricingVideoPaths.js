const mongoose = require('mongoose');
const { VideoPrice } = require('../models/Admin/pricingModels');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/upvc';

// Normalize file path function (same as in controller)
const normalizeFilePath = (filePath) => {
  if (!filePath) return '';
  
  let normalized = filePath.replace(/\\/g, '/');
  normalized = normalized.replace(/\/+/g, '/');
  
  const uploadsIndex = normalized.indexOf('uploads/');
  if (uploadsIndex !== -1) {
    normalized = normalized.substring(uploadsIndex);
  } else if (!normalized.startsWith('uploads/')) {
    normalized = 'uploads/' + normalized.replace(/^\//, '');
  }
  
  return normalized;
};

mongoose.connect(MONGO_URI).then(async () => {
  try {
    console.log('Fixing pricing video paths...');
    
    const videos = await VideoPrice.find();
    console.log(`Found ${videos.length} pricing videos`);
    
    for (const video of videos) {
      const originalPath = video.video;
      const normalizedPath = normalizeFilePath(originalPath);
      
      console.log(`\nVideo: ${video.title}`);
      console.log(`Original path: ${originalPath}`);
      console.log(`Normalized path: ${normalizedPath}`);
      
      if (originalPath !== normalizedPath) {
        video.video = normalizedPath;
        await video.save();
        console.log('✅ Updated path');
      } else {
        console.log('✅ Path already correct');
      }
      
      // Also normalize sponsor logo if present
      if (video.sponsorLogo) {
        const originalLogoPath = video.sponsorLogo;
        const normalizedLogoPath = normalizeFilePath(originalLogoPath);
        
        if (originalLogoPath !== normalizedLogoPath) {
          video.sponsorLogo = normalizedLogoPath;
          await video.save();
          console.log('✅ Updated sponsor logo path');
        }
      }
    }
    
    console.log('\n✅ All pricing video paths have been normalized');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
});