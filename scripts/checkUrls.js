/**
 * Quick script to check current URLs in database
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

const checkUrls = async () => {
  try {
    await connectDB();

    // Import models
    const { VideoPrice } = require('../models/Admin/pricingModels');
    const Category = require('../models/Admin/Category');

    console.log('\n📹 Checking VideoPrice URLs...');
    const videoPrices = await VideoPrice.find().limit(3);
    videoPrices.forEach((video, i) => {
      console.log(`Video ${i + 1}:`);
      console.log(`  ID: ${video._id}`);
      console.log(`  Video URL: ${video.video}`);
      console.log(`  Sponsor Logo: ${video.sponsorLogo || 'None'}`);
      console.log('');
    });

    console.log('\n📂 Checking Category URLs...');
    const categories = await Category.find().limit(3);
    categories.forEach((cat, i) => {
      console.log(`Category ${i + 1}:`);
      console.log(`  ID: ${cat._id}`);
      console.log(`  Name: ${cat.name}`);
      console.log(`  Legacy videoUrl: ${cat.videoUrl || 'None'}`);
      if (cat.videos && cat.videos.length > 0) {
        console.log(`  Videos array (${cat.videos.length} items):`);
        cat.videos.slice(0, 2).forEach((video, j) => {
          console.log(`    Video ${j + 1}: ${video.videoUrl}`);
          console.log(`    Sponsor Logo ${j + 1}: ${video.sponsorLogo || 'None'}`);
        });
      }
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Database connection closed');
  }
};

checkUrls();