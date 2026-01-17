/**
 * Check if the video file exists and get its info
 */

const fs = require('fs');
const path = require('path');

const videoPath = 'uploads/video/1768670846445-543006425.mp4';
const fullPath = path.join(__dirname, '..', videoPath);

console.log('🎥 Checking video file...');
console.log('File path:', fullPath);

if (fs.existsSync(fullPath)) {
  const stats = fs.statSync(fullPath);
  console.log('✅ File exists');
  console.log('📊 File size:', (stats.size / 1024 / 1024).toFixed(2), 'MB');
  console.log('📅 Created:', stats.birthtime);
  console.log('📝 Modified:', stats.mtime);
  
  // Check if file is empty or too small
  if (stats.size === 0) {
    console.log('❌ File is empty!');
  } else if (stats.size < 1024) {
    console.log('⚠️  File is very small (less than 1KB) - might be corrupted');
  } else {
    console.log('✅ File size looks normal');
  }
  
  // Try to read first few bytes to check file signature
  try {
    const buffer = fs.readFileSync(fullPath, { start: 0, end: 11 });
    const hex = buffer.toString('hex');
    console.log('🔍 File signature (first 12 bytes):', hex);
    
    // Check for MP4 signature
    if (hex.includes('66747970') || hex.includes('6d646174')) {
      console.log('✅ Valid MP4 file signature detected');
    } else {
      console.log('❌ Invalid MP4 file signature - file might be corrupted');
    }
  } catch (error) {
    console.log('❌ Error reading file:', error.message);
  }
  
} else {
  console.log('❌ File does not exist');
  
  // Check if directory exists
  const dir = path.dirname(fullPath);
  if (fs.existsSync(dir)) {
    console.log('📁 Directory exists, listing files:');
    const files = fs.readdirSync(dir);
    files.slice(0, 5).forEach(file => {
      console.log('  -', file);
    });
  } else {
    console.log('❌ Directory does not exist');
  }
}