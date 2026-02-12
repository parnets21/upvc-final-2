const Brand = require('../../models/Admin/Brand');
const Category = require('../../models/Admin/Category');

// Get all brands
exports.getAllBrands = async (req, res) => {
  try {
    const brands = await Brand.find().populate('categoryId', 'name').sort({ createdAt: -1 });
    res.status(200).json({ success: true, brands });
  } catch (error) {
    console.error('Error fetching brands:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch brands', error: error.message });
  }
};

// Get all active brands (for public/seller use)
exports.getAllActiveBrands = async (req, res) => {
  try {
    const brands = await Brand.find({ isActive: true }).sort({ name: 1 });
    res.status(200).json({ success: true, brands });
  } catch (error) {
    console.error('Error fetching brands:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch brands', error: error.message });
  }
};

// Get brands by category
exports.getBrandsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const brands = await Brand.find({ categoryId, isActive: true }).sort({ name: 1 });
    res.status(200).json({ success: true, brands });
  } catch (error) {
    console.error('Error fetching brands by category:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch brands', error: error.message });
  }
};

// Get single brand
exports.getBrandById = async (req, res) => {
  try {
    const { id } = req.params;
    const brand = await Brand.findById(id).populate('categoryId', 'name');
    
    if (!brand) {
      return res.status(404).json({ success: false, message: 'Brand not found' });
    }
    
    res.status(200).json({ success: true, brand });
  } catch (error) {
    console.error('Error fetching brand:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch brand', error: error.message });
  }
};

// Create new brand
exports.createBrand = async (req, res) => {
  try {
    const { categoryId, name, description } = req.body;

    // Validate required fields
    if (!categoryId || !name) {
      return res.status(400).json({ 
        success: false, 
        message: 'Category and Brand Name are required' 
      });
    }

    // Check if category exists
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    // Check if brand already exists for this category
    const existingBrand = await Brand.findOne({ 
      categoryId, 
      name: { $regex: new RegExp(`^${name}$`, 'i') } 
    });
    
    if (existingBrand) {
      return res.status(400).json({ 
        success: false, 
        message: 'Brand already exists for this category' 
      });
    }

    const brand = new Brand({
      categoryId,
      name,
      description: description || ''
    });

    await brand.save();
    await brand.populate('categoryId', 'name');

    res.status(201).json({ 
      success: true, 
      message: 'Brand created successfully', 
      brand 
    });
  } catch (error) {
    console.error('Error creating brand:', error);
    res.status(500).json({ success: false, message: 'Failed to create brand', error: error.message });
  }
};

// Update brand
exports.updateBrand = async (req, res) => {
  try {
    const { id } = req.params;
    const { categoryId, name, description, isActive } = req.body;

    const brand = await Brand.findById(id);
    if (!brand) {
      return res.status(404).json({ success: false, message: 'Brand not found' });
    }

    // If category is being changed, verify it exists
    if (categoryId && categoryId !== brand.categoryId.toString()) {
      const category = await Category.findById(categoryId);
      if (!category) {
        return res.status(404).json({ success: false, message: 'Category not found' });
      }
    }

    // Check for duplicate name in the same category
    if (name && name !== brand.name) {
      const existingBrand = await Brand.findOne({
        _id: { $ne: id },
        categoryId: categoryId || brand.categoryId,
        name: { $regex: new RegExp(`^${name}$`, 'i') }
      });

      if (existingBrand) {
        return res.status(400).json({ 
          success: false, 
          message: 'Brand with this name already exists for this category' 
        });
      }
    }

    // Update fields
    if (categoryId) brand.categoryId = categoryId;
    if (name) brand.name = name;
    if (description !== undefined) brand.description = description;
    if (isActive !== undefined) brand.isActive = isActive;

    await brand.save();
    await brand.populate('categoryId', 'name');

    res.status(200).json({ 
      success: true, 
      message: 'Brand updated successfully', 
      brand 
    });
  } catch (error) {
    console.error('Error updating brand:', error);
    res.status(500).json({ success: false, message: 'Failed to update brand', error: error.message });
  }
};

// Delete brand
exports.deleteBrand = async (req, res) => {
  try {
    const { id } = req.params;

    const brand = await Brand.findByIdAndDelete(id);
    if (!brand) {
      return res.status(404).json({ success: false, message: 'Brand not found' });
    }

    res.status(200).json({ 
      success: true, 
      message: 'Brand deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting brand:', error);
    res.status(500).json({ success: false, message: 'Failed to delete brand', error: error.message });
  }
};
