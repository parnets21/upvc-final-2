const fs = require('fs');
const path = require('path');

const videoPath = 'uploads/video/1768645568671-589522897.mp4';
const fullPath = path.join(__dirname, '..', videoPath);

console.log('Checking video file:', fullPath);
console.log('File exists:', fs.existsSync(fullPath));

if (fs.existsSync(fullPath)) {
  const stats = fs.statSync(fullPath);
  console.log('File size:', stats.size, 'bytes');
  console.log('File size (MB):', (stats.size / 1024 / 1024).toFixed(2));
  console.log('Created:', stats.birthtime);
  console.log('Modified:', stats.mtime);
  
  // Read first few bytes to check file header
  const fd = fs.openSync(fullPath, 'r');
  const buffer = Buffer.allocUnsafe(20);
  fs.readSync(fd, buffer, 0, 20, 0);
  fs.closeSync(fd);
  
  console.log('File header (hex):', buffer.toString('hex'));
  console.log('File header (ascii):', buffer.toString('ascii').replace(/[^\x20-\x7E]/g, '.'));
  
  // Check if it's a valid MP4 file (should start with specific bytes)
  const mp4Signatures = [
    '66747970', // 'ftyp' - MP4 signature
    '00000018', // Another common MP4 start
    '00000020', // Another common MP4 start
  ];
  
  const headerHex = buffer.toString('hex');
  const isValidMp4 = mp4Signatures.some(sig => headerHex.includes(sig));
  console.log('Appears to be valid MP4:', isValidMp4);
  
  // Check for common video file signatures
  if (headerHex.startsWith('000000')) {
    console.log('File starts with null bytes - likely valid MP4');
  } else {
    console.log('Unexpected file header - may be corrupted');
  }
}