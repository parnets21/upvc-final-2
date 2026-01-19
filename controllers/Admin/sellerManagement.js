const Seller = require('../../models/Seller/Seller');
const ExcelJS = require('exceljs');

// Get enhanced seller analytics
exports.getSellerAnalytics = async (req, res) => {
  try {
    const analytics = await Seller.aggregate([
      {
        $group: {
          _id: null,
          totalSellers: { $sum: 1 },
          approvedSellers: {
            $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
          },
          pendingSellers: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          rejectedSellers: {
            $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] }
          },
          blockedSellers: {
            $sum: { $cond: [{ $eq: ['$status', 'blocked'] }, 1, 0] }
          },
          verifiedSellers: {
            $sum: { $cond: ['$isVerified', 1, 0] }
          },
          sellersWithDocuments: {
            $sum: { 
              $cond: [
                { 
                  $or: [
                    { $ne: ['$gstCertificate', null] },
                    { $ne: ['$visitingCard', null] },
                    { $ne: ['$businessProfileVideo', null] }
                  ]
                }, 
                1, 
                0
              ]
            }
          },
          avgYearsInBusiness: { $avg: '$yearsInBusiness' }
        }
      }
    ]);

    // Get monthly registration trends
    const monthlyTrends = await Seller.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': -1, '_id.month': -1 }
      },
      {
        $limit: 12
      }
    ]);

    res.status(200).json({
      success: true,
      analytics: analytics[0] || {},
      monthlyTrends
    });

  } catch (error) {
    console.error('Error fetching seller analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching seller analytics',
      error: error.message
    });
  }
};

// Bulk operations for sellers
exports.bulkUpdateSellers = async (req, res) => {
  try {
    const { sellerIds, action, data } = req.body;

    if (!sellerIds || !Array.isArray(sellerIds) || sellerIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Seller IDs array is required'
      });
    }

    let updateData = {};
    
    switch (action) {
      case 'approve':
        updateData = { status: 'approved', isActive: true };
        break;
      case 'reject':
        if (!data?.reason) {
          return res.status(400).json({
            success: false,
            message: 'Rejection reason is required'
          });
        }
        updateData = { status: 'rejected', rejectionReason: data.reason, isActive: false };
        break;
      case 'block':
        updateData = { status: 'blocked', isActive: false };
        break;
      case 'activate':
        updateData = { isActive: true };
        break;
      case 'deactivate':
        updateData = { isActive: false };
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid action'
        });
    }

    const result = await Seller.updateMany(
      { _id: { $in: sellerIds } },
      updateData
    );

    res.status(200).json({
      success: true,
      message: `Bulk ${action} completed successfully`,
      modifiedCount: result.modifiedCount
    });

  } catch (error) {
    console.error('Error in bulk update:', error);
    res.status(500).json({
      success: false,
      message: 'Error performing bulk update',
      error: error.message
    });
  }
};

module.exports = {
  getSellerAnalytics: exports.getSellerAnalytics,
  bulkUpdateSellers: exports.bulkUpdateSellers
};