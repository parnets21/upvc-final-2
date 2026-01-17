
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Default allowed file types
const defaultAllowedTypes = ['image/', 'video/', 'application/pdf'];

// Video-specific configuration
const videoConfig = {
  // Only allow mobile-compatible formats
  allowedTypes: ['video/mp4', 'video/quicktime'],
  allowedExtensions: ['.mp4', '.mov'],
  // Increase max upload size for videos (1GB)
  maxSize: 1024 * 1024 * 1024,
  destination: 'uploads/sellers/videos'
};

// Universal multer middleware generator
const upload = (folder, allowedTypes = defaultAllowedTypes) => {
  // Special handling for videos
  if (folder === 'sellers/videos' || folder === 'sub-options/videos') {
    const storage = multer.diskStorage({
      destination: function (req, file, cb) {
        const dir = folder === 'sellers/videos' 
          ? path.join(videoConfig.destination)
          : path.join('uploads', folder);
        fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
      },
      filename: function (req, file, cb) {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
      }
    });

    const fileFilter = (req, file, cb) => {
      console.log("file.mimetype : " , file.mimetype);
      console.log("file.originalname : " , file.originalname);
      
      const fileExt = path.extname(file.originalname).toLowerCase();
      const isValidMime = videoConfig.allowedTypes.includes(file.mimetype);
      const isValidExt = videoConfig.allowedExtensions.includes(fileExt);
      
      if (isValidMime && isValidExt) {
        cb(null, true);
      } else {
        const error = `Invalid video format. Only MP4 and MOV files are supported for mobile compatibility. Received: ${fileExt} (${file.mimetype})`;
        console.error(error);
        cb(new Error(error), false);
      }
    };

    return multer({ 
      storage, 
      fileFilter,
      limits: { fileSize: videoConfig.maxSize }
    });
  }

  // Default handling for other uploads
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      const dir = path.join('uploads', folder);
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  });

  const fileFilter = (req, file, cb) => {
    const isValid = allowedTypes.some(type => {
      if (type.endsWith('/*')) {
        return file.mimetype.startsWith(type.replace('/*', '/'));
      }
      return file.mimetype === type;
    });

    if (isValid) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Only ${allowedTypes.join(', ')} are allowed.`), false);
    }
  };

  // Special handling for advertisements folder (can contain videos)
  const fileSizeLimit = folder === 'advertisements' 
    ? 1024 * 1024 * 1024 // 1GB for advertisements (videos)
    : 100 * 1024 * 1024; // 100MB for other uploads

  return multer({
    storage,
    // fileFilter,
    limits: {
      fileSize: fileSizeLimit
    }
  });
};

// Add direct video upload method to maintain backward compatibility
upload.video = (fieldName) => {
  return upload('sellers/videos').single(fieldName);
};

// Add specific method for pricing videos with strict validation
upload.pricingVideo = () => {
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      const dir = path.join('uploads', 'video');
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
      cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
    }
  });

  const fileFilter = (req, file, cb) => {
    console.log("Pricing video upload - file.mimetype:", file.mimetype);
    console.log("Pricing video upload - file.originalname:", file.originalname);
    
    const fileExt = path.extname(file.originalname).toLowerCase();
    const isValidMime = videoConfig.allowedTypes.includes(file.mimetype);
    const isValidExt = videoConfig.allowedExtensions.includes(fileExt);
    
    // Reject AVI and other incompatible formats explicitly
    if (fileExt === '.avi' || file.mimetype.includes('avi')) {
      const error = 'AVI format is not supported. Please use MP4 format for mobile compatibility.';
      console.error(error);
      cb(new Error(error), false);
      return;
    }
    
    if (isValidMime && isValidExt) {
      cb(null, true);
    } else {
      const error = `Invalid video format for pricing videos. Only MP4 and MOV files are supported. Received: ${fileExt} (${file.mimetype})`;
      console.error(error);
      cb(new Error(error), false);
    }
  };

  return multer({ 
    storage, 
    fileFilter,
    limits: { fileSize: videoConfig.maxSize }
  });
};

module.exports = upload;