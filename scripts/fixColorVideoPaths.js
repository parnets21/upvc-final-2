const mongoose = require('mongoose');
const ColorVideo = require('../models/Buyer/ColorVideo');
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
    console.log('Fixing color video paths...');
    
    const videos = await ColorVideo.find();
    console.log(`Found ${videos.length} color videos`);
    
    for (const video of videos) {
      const originalSrc = video.src;
      const originalFilepath = video.filepath;
      const originalSponsorLogo = video.sponsorLogo;
      
      const normalizedSrc = normalizeFilePath(originalSrc);
      const normalizedFilepath = normalizeFilePath(originalFilepath);
      const normalizedSponsorLogo = originalSponsorLogo ? normalizeFilePath(originalSponsorLogo) : null;
      
      console.log(`\nVideo: ${video.title}`);
      console.log(`Original src: ${originalSrc}`);
      console.log(`Normalized src: ${normalizedSrc}`);
      
      let updated = false;
      
      if (originalSrc !== normalizedSrc) {
        video.src = normalizedSrc;
        updated = true;
      }
      
      if (originalFilepath !== normalizedFilepath) {
        video.filepath = normalizedFilepath;
        updated = true;
      }
      
      if (originalSponsorLogo && originalSponsorLogo !== normalizedSponsorLogo) {
        video.sponsorLogo = normalizedSponsorLogo;
        updated = true;
      }
      
      if (updated) {
        await video.save();
        console.log('✅ Updated paths');
      } else {
        console.log('✅ Paths already correct');
      }
    }
    
    console.log('\n✅ All color video paths have been normalized');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
});