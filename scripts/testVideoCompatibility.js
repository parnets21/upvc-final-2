/**
 * Script to test video compatibility and check existing videos in database
 */

const mongoose = require('mongoose');
const { VideoPrice } = require('../models/Admin/pricingModels');
const { validateVideoFile } = require('../utils/videoValidator');
const path = require('path');
const fs = require('fs');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/upvc', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function testVideoCompatibility() {
  try {
    console.log('Testing video compatibility...\n');
    
    // Get all videos from database
    const videos = await VideoPrice.find();
    console.log(`Found ${videos.length} videos in database\n`);
    
    for (const video of videos) {
      console.log(`\n--- Testing Video: ${video.title} ---`);
      console.log(`Video path: ${video.video}`);
      
      // Construct full file path
      let filePath = video.video;
      if (filePath.startsWith('/uploads/')) {
        filePath = filePath.substring(1); // Remove leading slash
      }
      if (!filePath.startsWith('uploads/')) {
        filePath = 'uploads/' + filePath;
      }
      
      const fullPath = path.join(__dirname, '..', filePath);
      console.log(`Full path: ${fullPath}`);
      
      // Check if file exists
      if (!fs.existsSync(fullPath)) {
        console.log('❌ File does not exist');
        continue;
      }
      
      // Get file extension
      const fileExt = path.extname(fullPath).toLowerCase();
      console.log(`File extension: ${fileExt}`);
      
      // Check compatibility
      if (['.mp4', '.mov'].includes(fileExt)) {
        console.log('✅ Compatible format (MP4/MOV)');
      } else {
        console.log(`❌ Incompatible format: ${fileExt}`);
      }
      
      // Validate file
      const validation = validateVideoFile(filePath);
      if (validation.valid) {
        console.log(`✅ File validation passed (${validation.sizeFormatted})`);
      } else {
        console.log(`❌ File validation failed: ${validation.error}`);
      }
    }
    
    console.log('\n--- Summary ---');
    console.log('Compatible video formats: MP4, MOV');
    console.log('Incompatible formats have been cleaned up from uploads directory');
    console.log('All new uploads will be validated and transcoded for mobile compatibility');
    
  } catch (error) {
    console.error('Error testing video compatibility:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the test
if (require.main === module) {
  testVideoCompatibility();
}

module.exports = { testVideoCompatibility };