const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected for migration');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Migration function
const migrateVideoUrlToVideosArray = async () => {
  try {
    await connectDB();

    const Category = mongoose.model('Category', new mongoose.Schema({
      name: String,
      description: String,
      videoUrl: String,
      videos: Array,
      subCategories: String,
    }, { timestamps: true }));

    // Find all categories that have videoUrl but no videos array or empty videos array
    const categories = await Category.find({
      videoUrl: { $exists: true, $ne: null, $ne: '' },
      $or: [
        { videos: { $exists: false } },
        { videos: { $size: 0 } }
      ]
    });

    console.log(`Found ${categories.length} categories to migrate`);

    let migratedCount = 0;
    let skippedCount = 0;

    for (const category of categories) {
      try {
        // Create a video-sponsor item from the existing videoUrl
        const videoItem = {
          videoUrl: category.videoUrl,
          sponsorLogo: null,
          sponsorText: null,
          order: 0
        };

        // Update the category with the new videos array
        await Category.findByIdAndUpdate(
          category._id,
          { 
            $set: { videos: [videoItem] }
          }
        );

        migratedCount++;
        console.log(`Migrated category: ${category.name} (ID: ${category._id})`);
      } catch (error) {
        console.error(`Error migrating category ${category.name}:`, error.message);
        skippedCount++;
      }
    }

    console.log('\n=== Migration Summary ===');
    console.log(`Total categories found: ${categories.length}`);
    console.log(`Successfully migrated: ${migratedCount}`);
    console.log(`Skipped (errors): ${skippedCount}`);
    console.log('========================\n');

    await mongoose.connection.close();
    console.log('Migration completed and database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

migrateVideoUrlToVideosArray();
