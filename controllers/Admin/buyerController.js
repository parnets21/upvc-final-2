const User = require('../../models/Buyer/User');
const Lead = require('../../models/Admin/lead');

// Get all buyers with pagination and search
exports.getAllBuyers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    
    const filter = {};
    
    // Add search filter
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { mobileNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));

    const [total, buyers] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * pageSize)
        .limit(pageSize),
    ]);

    // Enhance buyers with lead information (city, lead count, etc.)
    const enhancedBuyers = await Promise.all(
      buyers.map(async (buyer) => {
        // Get the most recent lead to extract city information
        const recentLead = await Lead.findOne({ buyer: buyer._id })
          .sort({ createdAt: -1 })
          .select('projectInfo contactInfo')
          .lean();

        // Count total leads by this buyer
        const leadCount = await Lead.countDocuments({ buyer: buyer._id });

        // Extract city from lead data
        let city = null;
        let contactName = null;
        if (recentLead) {
          city = recentLead.projectInfo?.area || 
                 recentLead.projectInfo?.address || 
                 recentLead.projectInfo?.city;
          contactName = recentLead.contactInfo?.name;
        }

        return {
          ...buyer.toObject(),
          // Use name from buyer model, fallback to contact name from lead, then "Not Provided"
          name: buyer.name || contactName || null,
          city: city || null,
          leadCount: leadCount,
          lastLeadDate: recentLead ? recentLead.createdAt : null
        };
      })
    );

    res.status(200).json({
      success: true,
      total,
      page: pageNum,
      limit: pageSize,
      count: enhancedBuyers.length,
      buyers: enhancedBuyers
    });
  } catch (error) {
    console.error('Error fetching buyers:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get buyer by ID
exports.getBuyerById = async (req, res) => {
  try {
    const { buyerId } = req.params;
    const buyer = await User.findById(buyerId);
    
    if (!buyer) {
      return res.status(404).json({
        success: false,
        message: 'Buyer not found'
      });
    }

    res.status(200).json({
      success: true,
      buyer
    });
  } catch (error) {
    console.error('Error fetching buyer:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update buyer by admin
exports.updateBuyer = async (req, res) => {
  try {
    const { buyerId } = req.params;
    const updateData = req.body;

    // Check if mobile number is being updated and if it's already in use
    if (updateData.mobileNumber) {
      const existingUser = await User.findOne({ mobileNumber: updateData.mobileNumber });
      if (existingUser && existingUser._id.toString() !== buyerId) {
        return res.status(400).json({
          success: false,
          error: 'Mobile number already in use'
        });
      }
    }

    const buyer = await User.findByIdAndUpdate(
      buyerId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!buyer) {
      return res.status(404).json({
        success: false,
        message: 'Buyer not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Buyer updated successfully',
      buyer
    });
  } catch (error) {
    console.error('Error updating buyer:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Delete buyer
exports.deleteBuyer = async (req, res) => {
  try {
    const { buyerId } = req.params;

    const buyer = await User.findByIdAndDelete(buyerId);

    if (!buyer) {
      return res.status(404).json({
        success: false,
        message: 'Buyer not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Buyer deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting buyer:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};















