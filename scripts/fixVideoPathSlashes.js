const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected for path fix');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Fix function
const fixVideoPathSlashes = async () => {
  try {
    await connectDB();

    const Category = mongoose.model('Category', new mongoose.Schema({
      name: String,
      description: String,
      videos: Array,
    }, { timestamps: true }));

    // Find all categories with videos
    const categories = await Category.find({
      videos: { $exists: true, $ne: [] }
    });

    console.log(`Found ${categories.length} categories with videos`);

    let fixedCount = 0;

    for (const category of categories) {
      let needsUpdate = false;
      const fixedVideos = category.videos.map(video => {
        const fixed = { ...video.toObject() };
        
        if (fixed.videoUrl && fixed.videoUrl.includes('\\')) {
          fixed.videoUrl = fixed.videoUrl.replace(/\\/g, '/');
          needsUpdate = true;
        }
        
        if (fixed.sponsorLogo && fixed.sponsorLogo.includes('\\')) {
          fixed.sponsorLogo = fixed.sponsorLogo.replace(/\\/g, '/');
          needsUpdate = true;
        }
        
        return fixed;
      });

      if (needsUpdate) {
        await Category.findByIdAndUpdate(
          category._id,
          { $set: { videos: fixedVideos } }
        );
        fixedCount++;
        console.log(`Fixed paths for category: ${category.name}`);
      }
    }

    console.log('\n=== Fix Summary ===');
    console.log(`Total categories checked: ${categories.length}`);
    console.log(`Categories fixed: ${fixedCount}`);
    console.log('===================\n');

    await mongoose.connection.close();
    console.log('Fix completed and database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Fix error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

fixVideoPathSlashes();
