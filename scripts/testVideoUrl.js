const mongoose = require('mongoose');
const { VideoPrice } = require('../models/Admin/pricingModels');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/upvc';

mongoose.connect(MONGO_URI).then(async () => {
  try {
    const videos = await VideoPrice.find();
    
    console.log('Testing video URL construction:');
    console.log('');
    
    videos.forEach((video, index) => {
      console.log(`${index + 1}. Video: ${video.title}`);
      console.log(`   Database path: ${video.video}`);
      
      // Simulate React Native URL construction (old way)
      const oldUrl = `http://192.168.1.47:9000/${video.video}`;
      console.log(`   Old URL: ${oldUrl}`);
      
      // Simulate React Native URL construction (new way)
      const cleanPath = video.video.startsWith('/') ? video.video.substring(1) : video.video;
      const newUrl = `http://192.168.1.47:9000/${cleanPath}`;
      console.log(`   New URL: ${newUrl}`);
      
      console.log(`   URL looks correct: ${newUrl.includes('uploads/video/') && !newUrl.includes('//uploads')}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
});