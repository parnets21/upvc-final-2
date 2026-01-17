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
    // Check for duplicated base URL and fix it
    const baseUrl = process.env.BASE_URL || 'http://localhost:9000';
    const duplicatedPattern = `${baseUrl}/${baseUrl}/`;
    
    if (filePath.includes(duplicatedPattern)) {
      // Remove the first occurrence of base URL
      return filePath.replace(`${baseUrl}/`, '');
    }
    
    return filePath;
  }
  
  // Normalize the path (remove leading slashes, fix backslashes)
  let normalizedPath = filePath.replace(/\\/g, '/').replace(/^\/+/, '');
  
  // Get base URL from environment or use default
  const baseUrl = process.env.BASE_URL || 'http://localhost:9000';
  
  // Check if the path already contains the domain (common mistake)
  const baseUrlWithoutProtocol = baseUrl.replace(/^https?:\/\//, '');
  
  // If the path contains the domain, it might be a malformed URL
  if (normalizedPath.includes(baseUrlWithoutProtocol)) {
    // Extract just the uploads part
    const uploadsIndex = normalizedPath.indexOf('uploads/');
    if (uploadsIndex !== -1) {
      normalizedPath = normalizedPath.substring(uploadsIndex);
    }
  }
  
  // Ensure it starts with 'uploads/'
  if (!normalizedPath.startsWith('uploads/')) {
    normalizedPath = 'uploads/' + normalizedPath;
  }
  
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
  
  // If it's already a full URL, extract just the path part
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    try {
      const url = new URL(filePath);
      filePath = url.pathname;
    } catch (e) {
      // If URL parsing fails, continue with original string
    }
  }
  
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