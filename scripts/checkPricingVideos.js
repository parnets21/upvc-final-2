const mongoose = require('mongoose');
const { VideoPrice } = require('../models/Admin/pricingModels');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/upvc';

mongoose.connect(MONGO_URI).then(async () => {
  try {
    const videos = await VideoPrice.find();
    console.log('Pricing videos in database:');
    console.log('Total videos:', videos.length);
    console.log('');
    
    videos.forEach((video, index) => {
      console.log(`${index + 1}. Title: ${video.title}`);
      console.log(`   Video path: ${video.video}`);
      console.log(`   Created: ${video.createdAt}`);
      
      // Check if file exists
      let filePath = video.video;
      if (filePath.startsWith('/uploads/')) {
        filePath = filePath.substring(1);
      }
      if (!filePath.startsWith('uploads/')) {
        filePath = 'uploads/' + filePath;
      }
      
      const fullPath = path.join(__dirname, '..', filePath);
      const exists = fs.existsSync(fullPath);
      console.log(`   File exists: ${exists}`);
      
      if (exists) {
        const stats = fs.statSync(fullPath);
        const fileExt = path.extname(fullPath).toLowerCase();
        console.log(`   File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
        console.log(`   File extension: ${fileExt}`);
      }
      console.log('');
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
});