const path = require('path');

/**
 * Converts a relative file path to an absolute URL
 * @param {string} filePath - The relative file path (e.g., 'uploads/video/file.mp4')
 * @returns {string} - The absolute URL
 */
const toAbsoluteUrl = (filePath) => {
  if (!filePath) return null;
  
  // If already an absolute URL, return as is
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }
  
  // Normalize the path (remove leading slashes, fix backslashes)
  let normalizedPath = filePath.replace(/\\/g, '/').replace(/^\/+/, '');
  
  // Ensure it starts with 'uploads/'
  if (!normalizedPath.startsWith('uploads/')) {
    normalizedPath = 'uploads/' + normalizedPath;
  }
  
  // Get base URL from environment or use default
  const baseUrl = process.env.BASE_URL || 'http://localhost:9000';
  
  // Construct the full URL
  return `${baseUrl}/${normalizedPath}`;
};

/**
 * Normalizes file paths for consistent storage
 * @param {string} filePath - The file path to normalize
 * @returns {string} - The normalized path
 */
const normalizeFilePath = (filePath) => {
  if (!filePath) return '';
  
  // Replace backslashes with forward slashes
  let normalized = filePath.replace(/\\/g, '/');
  
  // Remove redundant slashes
  normalized = normalized.replace(/\/+/g, '/');
  
  // Extract relative path from 'uploads' directory
  const uploadsIndex = normalized.indexOf('uploads/');
  if (uploadsIndex !== -1) {
    normalized = normalized.substring(uploadsIndex);
  } else if (!normalized.startsWith('uploads/')) {
    // If path doesn't contain 'uploads/', assume it's relative to uploads
    normalized = 'uploads/' + normalized.replace(/^\//, '');
  }
  
  // Remove leading slash for consistency
  return normalized.replace(/^\//, '');
};

module.exports = {
  toAbsoluteUrl,
  normalizeFilePath
};