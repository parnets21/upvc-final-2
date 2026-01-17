/**
 * Test what the API is actually returning
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

const testApiResponse = async () => {
  try {
    await connectDB();

    // Import the URL helper
    const { toAbsoluteUrl } = require('../utils/urlHelper');
    
    // Import models
    const { VideoPrice } = require('../models/Admin/pricingModels');
    const Category = require('../models/Admin/Category');

    console.log('\n🔧 Testing URL Helper Function...');
    console.log(`BASE_URL: ${process.env.BASE_URL}`);
    
    // Test various URL formats
    const testUrls = [
      'uploads/video/1768672310496-746970735.mp4',
      '/uploads/video/1768672310496-746970735.mp4',
      'https://upvcconnect.com/uploads/video/1768672310496-746970735.mp4',
      'https://upvcconnect.com/https://upvcconnect.com/uploads/video/1768672310496-746970735.mp4'
    ];
    
    testUrls.forEach(url => {
      const result = toAbsoluteUrl(url);
      console.log(`Input:  ${url}`);
      console.log(`Output: ${result}`);
      console.log('---');
    });

    console.log('\n📹 Testing VideoPrice API Response...');
    const videoPrices = await VideoPrice.find().limit(1);
    if (videoPrices.length > 0) {
      const video = videoPrices[0];
      console.log('Raw from DB:', video.video);
      console.log('After toAbsoluteUrl:', toAbsoluteUrl(video.video));
      
      // Simulate what the API returns
      const apiResponse = {
        ...video._doc,
        video: toAbsoluteUrl(video.video),
        sponsorLogo: video.sponsorLogo ? toAbsoluteUrl(video.sponsorLogo) : null
      };
      console.log('API Response video URL:', apiResponse.video);
    }

    console.log('\n📂 Testing Category API Response...');
    const categories = await Category.find().limit(1);
    if (categories.length > 0) {
      const category = categories[0];
      console.log('Category name:', category.name);
      
      if (category.videos && category.videos.length > 0) {
        const video = category.videos[0];
        console.log('Raw video URL from DB:', video.videoUrl);
        console.log('After toAbsoluteUrl:', toAbsoluteUrl(video.videoUrl));
        
        // Simulate what the API returns
        const apiResponse = {
          ...video,
          videoUrl: toAbsoluteUrl(video.videoUrl),
          sponsorLogo: video.sponsorLogo ? toAbsoluteUrl(video.sponsorLogo) : null
        };
        console.log('API Response video URL:', apiResponse.videoUrl);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Database connection closed');
  }
};

testApiResponse();