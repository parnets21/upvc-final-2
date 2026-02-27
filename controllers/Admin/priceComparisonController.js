const { PriceComparison, PricePageContent } = require('../../models/Admin/PriceComparison');

// ============ Price Comparison CRUD ============

// Create a new price comparison row
exports.createPriceComparison = async (req, res) => {
  try {
    const { category, economy, midRange, premium, order } = req.body;
    
    if (!category || !economy || !midRange || !premium) {
      return res.status(400).json({ 
        error: 'Category, economy, midRange, and premium fields are required' 
      });
    }
    
    const newComparison = new PriceComparison({
      category,
      economy,
      midRange,
      premium,
      order: order || 0
    });

    await newComparison.save();
    res.status(201).json({
      success: true,
      data: newComparison
    });
  } catch (err) {
    console.error('Error creating price comparison:', err);
    res.status(500).json({ error: err.message });
  }
};

// Get all price comparisons (sorted by order)
exports.getAllPriceComparisons = async (req, res) => {
  try {
    const comparisons = await PriceComparison.find().sort({ order: 1, createdAt: 1 });
    res.json({
      success: true,
      data: comparisons
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get a single price comparison by ID
exports.getPriceComparisonById = async (req, res) => {
  try {
    const comparison = await PriceComparison.findById(req.params.id);
    if (!comparison) {
      return res.status(404).json({ error: 'Price comparison not found' });
    }
    res.json({
      success: true,
      data: comparison
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update a price comparison
exports.updatePriceComparison = async (req, res) => {
  try {
    const { category, economy, midRange, premium, order } = req.body;
    
    const updatedData = {};
    if (category !== undefined) updatedData.category = category;
    if (economy !== undefined) updatedData.economy = economy;
    if (midRange !== undefined) updatedData.midRange = midRange;
    if (premium !== undefined) updatedData.premium = premium;
    if (order !== undefined) updatedData.order = order;
    
    const updated = await PriceComparison.findByIdAndUpdate(
      req.params.id, 
      updatedData, 
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Price comparison not found' });
    }
    
    res.json({
      success: true,
      data: updated
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete a price comparison
exports.deletePriceComparison = async (req, res) => {
  try {
    const deleted = await PriceComparison.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Price comparison not found' });
    }
    res.json({ 
      success: true,
      message: 'Price comparison deleted successfully' 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ============ Price Page Content CRUD ============

// Get or create price page content
exports.getPricePageContent = async (req, res) => {
  try {
    let content = await PricePageContent.findOne();
    
    // If no content exists, create default
    if (!content) {
      content = new PricePageContent({
        headerSubtitle: 'When you are investing in uPVC windows & doors the price can vary based on several important factors- heres what goes into it',
        economyPrice: 'Starts at Rs. 350+GST',
        midPremiumPrice: 'Starts at Rs. 450+GST',
        premiumPrice: 'Starts at Rs. 550+GST'
      });
      await content.save();
    }
    
    res.json({
      success: true,
      data: content
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update price page content
exports.updatePricePageContent = async (req, res) => {
  try {
    const { headerSubtitle, economyPrice, midPremiumPrice, premiumPrice } = req.body;
    
    let content = await PricePageContent.findOne();
    
    if (!content) {
      // Create new if doesn't exist
      content = new PricePageContent({ 
        headerSubtitle: headerSubtitle || 'When you are investing in uPVC windows & doors the price can vary based on several important factors- heres what goes into it',
        economyPrice: economyPrice || 'Starts at Rs. 350+GST',
        midPremiumPrice: midPremiumPrice || 'Starts at Rs. 450+GST',
        premiumPrice: premiumPrice || 'Starts at Rs. 550+GST'
      });
      await content.save();
    } else {
      // Update existing
      if (headerSubtitle !== undefined) content.headerSubtitle = headerSubtitle;
      if (economyPrice !== undefined) content.economyPrice = economyPrice;
      if (midPremiumPrice !== undefined) content.midPremiumPrice = midPremiumPrice;
      if (premiumPrice !== undefined) content.premiumPrice = premiumPrice;
      content.updatedAt = Date.now();
      await content.save();
    }
    
    res.json({
      success: true,
      data: content
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = exports;
