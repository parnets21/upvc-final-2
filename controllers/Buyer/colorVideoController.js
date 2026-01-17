const fs = require('fs');
const path = require('path');

const ColorVideo = require('../../models/Buyer/ColorVideo');

// Utility function to normalize file paths (same as pricing controller)
const normalizeFilePath = (filePath) => {
  if (!filePath) return '';
  
  // Replace backslashes with forward slashes
  let normalized = filePath.replace(/\\/g, '/');
  
  // Remove redundant slashes
  normalized = normalized.replace(/\/+/g, '/');
  
  // If it's an absolute path, extract the relative path from 'uploads' directory
  const uploadsIndex = normalized.indexOf('uploads/');
  if (uploadsIndex !== -1) {
    normalized = normalized.substring(uploadsIndex);
  } else if (!normalized.startsWith('uploads/')) {
    // If path doesn't contain 'uploads/', assume it's relative to uploads
    normalized = 'uploads/' + normalized.replace(/^\//, '');
  }
  
  // DO NOT add leading slash - let the frontend handle the base URL
  return normalized;
};
// CREATE
const createColorVideo = async (req, res) => {
  try {
    const { title, description } = req.body;
    // Support both .single() and .fields() - check req.file first, then req.files.color
    const file = req.file || req.files?.color?.[0];

    if (!file) return res.status(400).json({ error: 'Video file is required' });

    const normalizedPath = normalizeFilePath(file.path);
    const sponsorLogoPath = req.files?.sponsorLogo?.[0] ? normalizeFilePath(req.files.sponsorLogo[0].path) : null;

    const newVideo = new ColorVideo({
      title,
      description,
      src: normalizedPath,
      filename: file.originalname,
      filepath: normalizedPath,
      mimetype: file.mimetype,
      filesize: file.size,
      sponsorLogo: sponsorLogoPath,
      sponsorText: req.body.sponsorText
    });

    await newVideo.save();
    
    // Return normalized response
    const responseVideo = {
      ...newVideo._doc,
      src: normalizedPath,
      filepath: normalizedPath,
      sponsorLogo: sponsorLogoPath
    };
    
    res.status(201).json({ message: 'Uploaded successfully', data: responseVideo });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getAllColorVideos = async (req, res) => {
  try {
    const videos = await ColorVideo.find().sort({ createdAt: -1 });
    // Normalize video paths in response
    const normalizedVideos = videos.map(video => ({
      ...video._doc,
      src: normalizeFilePath(video.src),
      filepath: normalizeFilePath(video.filepath),
      sponsorLogo: video.sponsorLogo ? normalizeFilePath(video.sponsorLogo) : null
    }));
    res.status(200).json(normalizedVideos);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
};

const getColorVideoById = async (req, res) => {
  try {
    const video = await ColorVideo.findById(req.params.id);
    if (!video) return res.status(404).json({ error: 'Video not found' });

    // Normalize paths in response
    const normalizedVideo = {
      ...video._doc,
      src: normalizeFilePath(video.src),
      filepath: normalizeFilePath(video.filepath),
      sponsorLogo: video.sponsorLogo ? normalizeFilePath(video.sponsorLogo) : null
    };

    res.status(200).json(normalizedVideo);
  } catch (error) {
    console.error('Get by ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


// UPDATE
const updateColorVideo = async (req, res) => {
  try {
    const { title, description, sponsorText } = req.body;
    const videoId = req.params.id;
    // Support both .single() and .fields() - check req.file first, then req.files.color
    const file = req.file || req.files?.color?.[0];

    const existing = await ColorVideo.findById(videoId);
    if (!existing) return res.status(404).json({ error: 'Video not found' });

    // Prepare update data
    const updateData = {
      title: title || existing.title,
      description: description || existing.description,
      sponsorText: sponsorText || existing.sponsorText
    };

    // If a new file is uploaded
    if (file) {
      const newFilePath = normalizeFilePath(file.path);

      // Delete old file
      const oldPath = normalizeFilePath(existing.filepath);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(path.resolve(oldPath));
      }

      // Assign new file details
      updateData.src = newFilePath;
      updateData.filepath = newFilePath;
      updateData.filename = file.originalname;
      updateData.mimetype = file.mimetype;
      updateData.filesize = file.size;
    }
    if (req.files?.sponsorLogo?.[0]) { 
      updateData.sponsorLogo = req.files.sponsorLogo[0].path;
    }

    const updated = await ColorVideo.findByIdAndUpdate(videoId, updateData, {
      new: true
    });

    res.status(200).json({
      message: 'Color video updated successfully',
      data: updated
    });
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// DELETE
const deleteColorVideo = async (req, res) => {
  try {
    const video = await ColorVideo.findByIdAndDelete(req.params.id);
    if (!video) return res.status(404).json({ error: 'Video not found' });

    const fileToDelete = normalizeFilePath(video.filepath);
    if (fileToDelete && fs.existsSync(fileToDelete)) {
      fs.unlinkSync(path.resolve(fileToDelete));
    }

    res.status(200).json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete video' });
  }
};

module.exports = {
  createColorVideo,
  getAllColorVideos,
  getColorVideoById,
  updateColorVideo,
  deleteColorVideo,
};
