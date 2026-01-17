const SubCategory = require("../../models/Admin/SubCategory");
const { toAbsoluteUrl, normalizeFilePath } = require('../../utils/urlHelper');

exports.createSubCategory = async (req, res) => {
  try {
    const body = req.body || {};
    const { name, parentCategory, videoUrl, features, benefits, description, subCategories } = body;

    if (!name || !parentCategory) {
      return res.status(400).json({ message: 'name and parentCategory are required' });
    }
    const file = req.file; // optional

    const finalVideoUrl = file
      ? normalizeFilePath(`uploads/sellers/videos/${file.filename}`)
      : normalizeFilePath(videoUrl);

    const sub = await SubCategory.create({
      name,
      parentCategory,
      videoUrl: finalVideoUrl,
      features,
      benefits,
      description,
      subCategories,
    });
    res.status(201).json(sub);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllSubCategories = async (req, res) => {
  try {
    console.log('=== GET /api/subcategories - Public route accessed ===');
    console.log('Request headers:', req.headers);
    console.log('No authentication required for this route');
    
    // For mobile app, return all subcategories without pagination
    // For admin panel, use pagination if page/limit are provided
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);
    
    let query = SubCategory.find().populate("parentCategory").sort({ createdAt: -1 });
    
    if (page && limit) {
      // Pagination requested (admin panel)
      const skip = (page - 1) * limit;
      query = query.skip(skip).limit(limit);
    }
    // Otherwise return all (mobile app)
    
    const subs = await query;
    
    // Convert video URLs to absolute URLs
    const subsWithAbsoluteUrls = subs.map(sub => {
      const subObj = sub.toObject();
      if (subObj.videoUrl) {
        subObj.videoUrl = toAbsoluteUrl(subObj.videoUrl);
      }
      return subObj;
    });
    
    console.log(`Returning ${subsWithAbsoluteUrls.length} subcategories`);
    res.json(subsWithAbsoluteUrls);
  } catch (error) {
    console.error('Error fetching subcategories:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.updateSubCategory = async (req, res) => {
  try {
    const updates = { ...(req.body || {}) };
    if (req.file) {
      updates.videoUrl = normalizeFilePath(`uploads/sellers/videos/${req.file.filename}`);
    } else if (updates.videoUrl) {
      updates.videoUrl = normalizeFilePath(updates.videoUrl);
    }
    const updated = await SubCategory.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true }
    );
    
    // Convert to object and fix video URL for response
    const updatedObj = updated.toObject();
    if (updatedObj.videoUrl) {
      updatedObj.videoUrl = toAbsoluteUrl(updatedObj.videoUrl);
    }
    
    res.json(updatedObj);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteSubCategory = async (req, res) => {
  await SubCategory.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
};
