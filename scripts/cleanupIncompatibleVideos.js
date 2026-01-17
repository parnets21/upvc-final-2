/**
 * Script to clean up incompatible video files from uploads directory
 * This will remove AVI files and other formats not supported by ExoPlayer
 */

const fs = require('fs');
const path = require('path');

const UPLOADS_DIR = path.join(__dirname, '../uploads/video');
const INCOMPATIBLE_EXTENSIONS = ['.avi', '.avif', '.wmv', '.flv', '.mkv'];
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

function cleanupIncompatibleVideos() {
  console.log('Starting cleanup of incompatible video files...');
  console.log('Directory:', UPLOADS_DIR);
  
  if (!fs.existsSync(UPLOADS_DIR)) {
    console.log('Video uploads directory does not exist');
    return;
  }
  
  const files = fs.readdirSync(UPLOADS_DIR);
  let removedCount = 0;
  let movedCount = 0;
  
  // Create a separate directory for images if it doesn't exist
  const imagesDir = path.join(__dirname, '../uploads/images');
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }
  
  files.forEach(file => {
    const filePath = path.join(UPLOADS_DIR, file);
    const fileExt = path.extname(file).toLowerCase();
    
    // Remove incompatible video formats
    if (INCOMPATIBLE_EXTENSIONS.includes(fileExt)) {
      try {
        fs.unlinkSync(filePath);
        console.log(`Removed incompatible video: ${file}`);
        removedCount++;
      } catch (error) {
        console.error(`Error removing ${file}:`, error.message);
      }
    }
    
    // Move image files to images directory
    else if (IMAGE_EXTENSIONS.includes(fileExt)) {
      try {
        const newPath = path.join(imagesDir, file);
        fs.renameSync(filePath, newPath);
        console.log(`Moved image file: ${file} -> images/`);
        movedCount++;
      } catch (error) {
        console.error(`Error moving ${file}:`, error.message);
      }
    }
    
    // Log compatible video files
    else if (['.mp4', '.mov'].includes(fileExt)) {
      console.log(`Compatible video file: ${file}`);
    }
  });
  
  console.log('\nCleanup completed:');
  console.log(`- Removed ${removedCount} incompatible video files`);
  console.log(`- Moved ${movedCount} image files to images directory`);
  console.log('- Only MP4 and MOV files remain in video directory');
}

// Run the cleanup
if (require.main === module) {
  cleanupIncompatibleVideos();
}

module.exports = { cleanupIncompatibleVideos };