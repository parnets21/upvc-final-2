/**
 * Script to fix duplicated URLs in the database
 * This fixes URLs like "https://upvcconnect.com/https://upvcconnect.com/uploads/..."
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

// Import models
const VideoPrice = require('../models/Admin/pricingModels').VideoPrice;
const Category = require('../models/Admin/Category');
const SubCategory = require('../models/Admin/SubCategory');

const fixDuplicatedUrls = async () => {
  console.log('🔧 Starting URL duplication fix...\n');

  try {
    await connectDB();

    const baseUrl = process.env.BASE_URL || 'https://upvcconnect.com';
    const baseUrlPattern = baseUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape special regex chars
    
    // Function to clean duplicated URLs
    const cleanUrl = (url) => {
      if (!url) return url;
      
      // Pattern to match duplicated base URLs
      const duplicatedPattern = new RegExp(`^${baseUrlPattern}/${baseUrlPattern}/`, 'i');
      
      if (duplicatedPattern.test(url)) {
        // Remove the first occurrence of base URL
        return url.replace(new RegExp(`^${baseUrlPattern}/`, 'i'), '');
      }
      
      return url;
    };

    // Fix VideoPrice collection
    console.log('📹 Fixing VideoPrice collection...');
    const videoPrices = await VideoPrice.find({
      $or: [
        { video: new RegExp(`^${baseUrlPattern}/${baseUrlPattern}/`, 'i') },
        { sponsorLogo: new RegExp(`^${baseUrlPattern}/${baseUrlPattern}/`, 'i') }
      ]
    });

    for (const videoPrice of videoPrices) {
      let updated = false;
      
      if (videoPrice.video && videoPrice.video.includes(`${baseUrl}/${baseUrl}/`)) {
        videoPrice.video = cleanUrl(videoPrice.video);
        updated = true;
        console.log(`  Fixed video URL: ${videoPrice._id}`);
      }
      
      if (videoPrice.sponsorLogo && videoPrice.sponsorLogo.includes(`${baseUrl}/${baseUrl}/`)) {
        videoPrice.sponsorLogo = cleanUrl(videoPrice.sponsorLogo);
        updated = true;
        console.log(`  Fixed sponsor logo URL: ${videoPrice._id}`);
      }
      
      if (updated) {
        await videoPrice.save();
      }
    }

    // Fix Category collection
    console.log('\n📂 Fixing Category collection...');
    const categories = await Category.find({
      $or: [
        { videoUrl: new RegExp(`^${baseUrlPattern}/${baseUrlPattern}/`, 'i') },
        { 'videos.videoUrl': new RegExp(`^${baseUrlPattern}/${baseUrlPattern}/`, 'i') },
        { 'videos.sponsorLogo': new RegExp(`^${baseUrlPattern}/${baseUrlPattern}/`, 'i') }
      ]
    });

    for (const category of categories) {
      let updated = false;
      
      // Fix legacy videoUrl field
      if (category.videoUrl && category.videoUrl.includes(`${baseUrl}/${baseUrl}/`)) {
        category.videoUrl = cleanUrl(category.videoUrl);
        updated = true;
        console.log(`  Fixed category videoUrl: ${category._id}`);
      }
      
      // Fix videos array
      if (category.videos && category.videos.length > 0) {
        category.videos.forEach((video, index) => {
          if (video.videoUrl && video.videoUrl.includes(`${baseUrl}/${baseUrl}/`)) {
            category.videos[index].videoUrl = cleanUrl(video.videoUrl);
            updated = true;
            console.log(`  Fixed category video[${index}] URL: ${category._id}`);
          }
          
          if (video.sponsorLogo && video.sponsorLogo.includes(`${baseUrl}/${baseUrl}/`)) {
            category.videos[index].sponsorLogo = cleanUrl(video.sponsorLogo);
            updated = true;
            console.log(`  Fixed category video[${index}] sponsor logo: ${category._id}`);
          }
        });
      }
      
      if (updated) {
        await category.save();
      }
    }

    // Fix SubCategory collection
    console.log('\n📁 Fixing SubCategory collection...');
    const subCategories = await SubCategory.find({
      videoUrl: new RegExp(`^${baseUrlPattern}/${baseUrlPattern}/`, 'i')
    });

    for (const subCategory of subCategories) {
      if (subCategory.videoUrl && subCategory.videoUrl.includes(`${baseUrl}/${baseUrl}/`)) {
        subCategory.videoUrl = cleanUrl(subCategory.videoUrl);
        await subCategory.save();
        console.log(`  Fixed subcategory videoUrl: ${subCategory._id}`);
      }
    }

    console.log('\n✅ URL duplication fix completed successfully!');
    console.log(`📊 Fixed ${videoPrices.length} video prices, ${categories.length} categories, ${subCategories.length} subcategories`);
    
  } catch (error) {
    console.error('❌ Error during URL fix:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Database connection closed');
  }
};

// Run the script
if (require.main === module) {
  fixDuplicatedUrls();
}

module.exports = { fixDuplicatedUrls };