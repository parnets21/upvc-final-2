const Category = require("../../models/Admin/Category");
const SubCategory = require("../../models/Admin/SubCategory");

exports.createCategory = async (req, res) => {
  try {
    console.log("Create category - req.body:", req.body);
    console.log("Create category - req.files:", req.files);
    
    const { name, description, videosCount } = req.body || {};

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name is required",
      });
    }

    const trimmedName = name.trim();
    
    // Check if category with same name already exists
    const existingCategory = await Category.findOne({ name: trimmedName });
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: "Category with this name already exists",
      });
    }

    // Create category with name and description fields
    const categoryData = {
      name: trimmedName,
    };
    
    // Only add description if it's not empty
    if (description && description.trim()) {
      categoryData.description = description.trim();
    }

    // Process videos array from FormData
    const count = parseInt(videosCount) || 0;
    if (count > 0 && req.files) {
      const videos = [];
      
      for (let i = 0; i < count; i++) {
        const videoItem = {};
        
        // Find video file
        const videoFile = req.files.find(f => f.fieldname === `video_${i}`);
        if (videoFile) {
          videoItem.videoUrl = videoFile.path.replace(/\\/g, '/');
        } else if (req.body[`videoUrl_${i}`]) {
          videoItem.videoUrl = req.body[`videoUrl_${i}`];
        }
        
        // Find sponsor logo file
        const sponsorLogoFile = req.files.find(f => f.fieldname === `sponsorLogo_${i}`);
        if (sponsorLogoFile) {
          videoItem.sponsorLogo = sponsorLogoFile.path.replace(/\\/g, '/');
        } else if (req.body[`sponsorLogoUrl_${i}`]) {
          videoItem.sponsorLogo = req.body[`sponsorLogoUrl_${i}`];
        }
        
        // Get sponsor text
        if (req.body[`sponsorText_${i}`]) {
          videoItem.sponsorText = req.body[`sponsorText_${i}`];
        }
        
        // Get order field (use provided order or default to index)
        videoItem.order = req.body[`order_${i}`] !== undefined 
          ? parseInt(req.body[`order_${i}`]) 
          : i;
        
        // Only add if we have at least a video URL
        if (videoItem.videoUrl) {
          videos.push(videoItem);
        }
      }
      
      if (videos.length > 0) {
        categoryData.videos = videos;
      }
    }
    
    console.log("Creating category with data:", categoryData);
    const category = await Category.create(categoryData);

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      category,
    });
  } catch (error) {
    console.error("Error creating category:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
      details: error.errors || null,
    });
  }
};

exports.getAllCategories = async (req, res) => {
  // const page = parseInt(req.query.page) || 1;
  // const limit = parseInt(req.query.limit) || 5;
  // const skip = (page - 1) * limit;
  try {
    const categories = await Category.find()
      // .skip(skip)
      // .limit(limit)
      .sort({ createdAt: -1 });
    const populated = await Promise.all(
      categories.map(async (cat) => {
        const subcategories = await SubCategory.find({
          parentCategory: cat._id,
        });
        return { ...cat.toObject(), subcategories };
      })
    );
    res.json(populated);
  } catch (error) {
    console.error("Error : ", error);
    res.status(400).json({
      error: error.message,
      details: error.errors,
    });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    console.log("Update category - req.body:", req.body);
    console.log("Update category - req.params:", req.params);
    console.log("Update category - req.files:", req.files);
    
    const { name, description, videosCount } = req.body || {};
    const { id } = req.params;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name is required",
      });
    }

    const trimmedName = name.trim();

    // Check if another category with same name exists
    const existingCategory = await Category.findOne({ 
      name: trimmedName,
      _id: { $ne: id }
    });
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: "Category with this name already exists",
      });
    }

    // Prepare update data
    const updateData = { 
      name: trimmedName,
    };
    
    // Only add description if it's not empty
    if (description && description.trim()) {
      updateData.description = description.trim();
    }

    // Process videos array from FormData
    const count = parseInt(videosCount) || 0;
    if (count > 0) {
      const videos = [];
      
      for (let i = 0; i < count; i++) {
        const videoItem = {};
        
        // Find video file
        const videoFile = req.files?.find(f => f.fieldname === `video_${i}`);
        if (videoFile) {
          videoItem.videoUrl = videoFile.path.replace(/\\/g, '/');
        } else if (req.body[`videoUrl_${i}`]) {
          videoItem.videoUrl = req.body[`videoUrl_${i}`];
        }
        
        // Find sponsor logo file
        const sponsorLogoFile = req.files?.find(f => f.fieldname === `sponsorLogo_${i}`);
        if (sponsorLogoFile) {
          videoItem.sponsorLogo = sponsorLogoFile.path.replace(/\\/g, '/');
        } else if (req.body[`sponsorLogoUrl_${i}`]) {
          videoItem.sponsorLogo = req.body[`sponsorLogoUrl_${i}`];
        }
        
        // Get sponsor text
        if (req.body[`sponsorText_${i}`]) {
          videoItem.sponsorText = req.body[`sponsorText_${i}`];
        }
        
        // Get order field (use provided order or default to index)
        videoItem.order = req.body[`order_${i}`] !== undefined 
          ? parseInt(req.body[`order_${i}`]) 
          : i;
        
        // Only add if we have at least a video URL
        if (videoItem.videoUrl) {
          videos.push(videoItem);
        }
      }
      
      updateData.videos = videos;
    } else {
      // If no videos provided, clear the videos array
      updateData.videos = [];
    }

    const updated = await Category.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      category: updated,
    });
  } catch (error) {
    console.error("Error updating category:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
      details: error.errors || null,
    });
  }
};

exports.deleteCategory = async (req, res) => {
  await Category.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
};
