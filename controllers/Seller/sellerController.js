const Seller = require('../../models/Seller/Seller');
const path = require('path');
const fs = require('fs');
const { signOTPToken } = require('../../utils/jwtHelper');
const ExcelJS = require('exceljs');

// Register new seller
exports.registerSeller = async (req, res) => {
  try {
    const { 
      phoneNumber,
      companyName,
      address,
      city,
      yearsInBusiness,
      pinCode,
      email,
      website,
      gstNumber,
      contactPerson,
      contactNumber,
      brandOfProfileUsed
    } = req.body;

    // Check if seller already exists
    const existingSeller = await Seller.findOne({ phoneNumber });
    if (existingSeller && existingSeller.isVerified) {
      return res.status(400).json({ 
        success: false, 
        message: 'Seller already registered' 
      });
    }

    // Process uploaded files
    const gstCertificatePath = req.files['gstCertificate'] 
      ? path.join('sellers', req.files['gstCertificate'][0].filename) 
      : null;
    const visitingCardPath = req.files['visitingCard'] 
      ? path.join('sellers', req.files['visitingCard'][0].filename) 
      : null;
    const businessProfileVideoPath = req.files['businessProfileVideo'] 
      ? path.join('sellers', req.files['businessProfileVideo'][0].filename) 
      : null;

    // Create or update seller
    const sellerData = {
      phoneNumber,
      isVerified: true,
      status: 'pending',
      isActive: false, 
      companyName,
      address,
      city,
      yearsInBusiness,
      pinCode,
      email,
      website,
      gstNumber,
      contactPerson,
      contactNumber,
      brandOfProfileUsed,
      gstCertificate: gstCertificatePath,
      visitingCard: visitingCardPath,
      businessProfileVideo: businessProfileVideoPath
    };

    let seller;
    if (existingSeller) {
      // Update existing seller
      seller = await Seller.findByIdAndUpdate(existingSeller._id, sellerData, { new: true });
    } else {
      // Create new seller
      seller = await Seller.create(sellerData);
    }
      const token = signOTPToken({ 
        phoneNumber, 
        sellerId: seller._id,
      })
    res.status(201).json({ 
      success: true, 
      message: 'Seller registered successfully',
      seller ,
      token
    });
  } catch (error) {
    console.error('Error in registerSeller:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

// Get seller profile
exports.getSellerProfile = async (req, res) => {
  try { 

    const seller = await Seller.findOne({ _id : req.seller._id }).populate({
      path: 'leads',
      populate: {
        path: 'quotes.product category',
      },
    });
    if (!seller) {
      return res.status(404).json({ 
        success: false, 
        message: 'Seller not found' 
      });
    }

    // Check if seller is approved
    // if (seller.status !== 'approved') {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'Seller account not approved yet',
    //     status: seller.status,
    //     rejectionReason: seller.rejectionReason
    //   });
    // }

    res.status(200).json({ 
      success: true, 
      seller 
    });
  } catch (error) {
    console.error('Error in getSellerProfile:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

// Update seller profile
exports.updateSellerProfile = async (req, res) => {
  try {
    // const { phoneNumber } = req.params;
    const _id = req.seller._id;
    const updateData = req.body;
  
    const existingSeller = await Seller.findOne({ _id });
    if (!existingSeller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    if (existingSeller.status !== 'approved') {
      return res.status(403).json({
        success: false,
        message: 'Only approved sellers can update profiles',
        status: existingSeller.status
      });
    }

    // Process uploaded files
    if (req.files) {
      if (req.files['gstCertificate']) {
        updateData.gstCertificate = path.join('sellers', req.files['gstCertificate'][0].filename);
      }
      if (req.files['visitingCard']) {
        updateData.visitingCard = path.join('sellers', req.files['visitingCard'][0].filename);
      }
      if (req.files['businessProfileVideo']) {
        updateData.businessProfileVideo = path.join('sellers', req.files['businessProfileVideo'][0].filename);
      }
    }

    const seller = await Seller.findOneAndUpdate(
      { _id },
      updateData,
      { new: true }
    );

    if (!seller) {
      return res.status(404).json({ 
        success: false, 
        message: 'Seller not found' 
      });
    }

    res.status(200).json({ 
      success: true, 
      message: 'Seller profile updated successfully',
      seller 
    });
  } catch (error) {
    console.error('Error in updateSellerProfile:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

// Add or Update Business Profile Video
// exports.handleBusinessVideo = async (req, res) => {
//   try {
//     const { sellerId } = req.params;
    
//     if (!req.file) {
//       return res.status(400).json({
//         success: false,
//         message: 'No video file uploaded'
//       });
//     }

//     // Validate seller exists
//     const seller = await Seller.findById(sellerId);
//     if (!seller) {
//       return res.status(404).json({
//         success: false,
//         message: 'Seller not found'
//       });
//     }

//     // Delete old video if exists
//     if (seller.businessProfileVideo) {
//       const oldVideoPath = path.join(__dirname, '../../public', seller.businessProfileVideo);
//       if (fs.existsSync(oldVideoPath)) {
//         fs.unlinkSync(oldVideoPath);
//       }
//     }

//     // Save new video
//     const videoPath = `/uploads/sellers/videos/${sellerId}-${Date.now()}${path.extname(req.file.originalname)}`;
//     const uploadDir = path.join(__dirname, '../../public/uploads/sellers/videos');
    
//     if (!fs.existsSync(uploadDir)) {
//       fs.mkdirSync(uploadDir, { recursive: true });
//     }

//     fs.writeFileSync(path.join(__dirname, '../../public', videoPath), req.file.buffer);

//     // Update seller record
//     seller.businessProfileVideo = videoPath;
//     await seller.save();

//     res.status(200).json({
//       success: true,
//       message: 'Business profile video updated successfully',
//       videoUrl: videoPath
//     });
//   } catch (error) {
//     console.error('Error handling business video:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Internal server error',
//       error: error.message
//     });
//   }
// }; 

exports.handleBusinessVideo = async (req, res) => {
  try {
    // console.log("req.seller._id : " , req.seller._id)
    const sellerId = req.seller._id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No video file uploaded'
      });
    }

    const seller = await Seller.findById(sellerId);
    console.log("seller : " , seller)
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    // Delete old video if it exists
    if (seller.businessProfileVideo) {
      const oldVideoPath = path.join(__dirname, '../../public', seller.businessProfileVideo);
      if (fs.existsSync(oldVideoPath)) {
        fs.unlinkSync(oldVideoPath);
      }
    }

    // Save the multer-uploaded video path
    const relativeVideoPath = `/uploads/sellers/videos/${req.file.filename}`;
    seller.businessProfileVideo = relativeVideoPath;
    await seller.save();

    res.status(200).json({
      success: true,
      message: 'Business profile video updated successfully',
      videoUrl: relativeVideoPath
    });

  } catch (error) {
    console.error('Error handling business video:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};


// Delete Business Profile Video
exports.deleteBusinessVideo = async (req, res) => {
  try {
    const { sellerId } = req.params;

    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    if (!seller.businessProfileVideo) {
      return res.status(400).json({
        success: false,
        message: 'No business video exists to delete'
      });
    }

    // Delete video file
    const videoPath = path.join(__dirname, '../../public', seller.businessProfileVideo);
    if (fs.existsSync(videoPath)) {
      fs.unlinkSync(videoPath);
    }

    // Update seller record
    seller.businessProfileVideo = undefined;
    await seller.save();

    res.status(200).json({
      success: true,
      message: 'Business profile video deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting business video:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Approve seller
exports.approveSeller = async (req, res) => {
  try {
    const { sellerId } = req.params;

    const seller = await Seller.findByIdAndUpdate(
      sellerId,
      { status: 'approved', isActive: true },
      { new: true }
    );

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Seller approved successfully',
      seller
    });
  } catch (error) {
    console.error('Error approving seller:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Reject seller
exports.rejectSeller = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    const seller = await Seller.findByIdAndUpdate(
      sellerId,
      { status: 'rejected', rejectionReason: reason, isActive: false },
      { new: true }
    );

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Seller rejected successfully',
      seller
    });
  } catch (error) {
    console.error('Error rejecting seller:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Block/Unblock seller
exports.toggleSellerStatus = async (req, res) => {
  try {
    const { sellerId } = req.params;

    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    const newStatus = !seller.isActive;
    const statusText = newStatus ? 'unblocked' : 'blocked';

    seller.isActive = newStatus;
    seller.status = newStatus ? 'approved' : 'blocked';
    await seller.save();

    res.status(200).json({
      success: true,
      message: `Seller ${statusText} successfully`,
      seller
    });
  } catch (error) {
    console.error('Error toggling seller status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get all sellers with advanced filters
exports.getAllSellers = async (req, res) => {
  try {
    const { 
      status, 
      page = 1, 
      limit = 10, 
      search, 
      city, 
      isVerified, 
      dateFrom, 
      dateTo,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    // First, let's check if there are any sellers at all
    const totalSellers = await Seller.countDocuments({});
    
    if (totalSellers === 0) {
      return res.status(200).json({
        success: true,
        total: 0,
        page: 1,
        limit: 10,
        count: 0,
        sellers: [],
        message: 'No sellers found in database'
      });
    }
    
    const filter = {};
    
    // Status filter
    if (status) {
      filter.status = status;
    }

    // City filter
    if (city) {
      filter.city = { $regex: city, $options: 'i' };
    }

    // Verification status filter
    if (isVerified !== undefined && isVerified !== '' && isVerified !== null) {
      filter.isVerified = isVerified === 'true';
    }

    // Date range filter
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) {
        filter.createdAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        filter.createdAt.$lte = new Date(dateTo);
      }
    }

    // Enhanced search filter
    if (search) {
      filter.$or = [
        { companyName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } },
        { contactNumber: { $regex: search, $options: 'i' } },
        { contactPerson: { $regex: search, $options: 'i' } },
        { gstNumber: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
        { pinCode: { $regex: search, $options: 'i' } }
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));

    // Sort configuration
    const sortConfig = {};
    sortConfig[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [total, sellers] = await Promise.all([
      Seller.countDocuments(filter),
      Seller.find(filter)
        .populate('leads', 'createdAt status')
        .sort(sortConfig)
        .skip((pageNum - 1) * pageSize)
        .limit(pageSize),
    ]);

    // Add computed fields for enhanced display
    const enhancedSellers = sellers.map(seller => {
      const sellerObj = seller.toObject();
      return {
        ...sellerObj,
        totalLeads: seller.leads ? seller.leads.length : 0,
        hasDocuments: !!(seller.gstCertificate || seller.visitingCard || seller.businessProfileVideo),
        documentCount: [seller.gstCertificate, seller.visitingCard, seller.businessProfileVideo].filter(Boolean).length,
        registrationAge: Math.floor((Date.now() - seller.createdAt) / (1000 * 60 * 60 * 24)), // days
        quotaUtilization: seller.freeQuota ? (seller.freeQuota.usedQuota / seller.freeQuota.currentMonthQuota * 100).toFixed(1) : 0
      };
    });

    res.status(200).json({
      success: true,
      total,
      page: pageNum,
      limit: pageSize,
      count: sellers.length,
      sellers: enhancedSellers
    });
  } catch (error) {
    console.error('Error fetching sellers:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get seller by ID (for admin)
exports.getSellerById = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const seller = await Seller.findById(sellerId);
    
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    res.status(200).json({
      success: true,
      seller
    });
  } catch (error) {
    console.error('Error fetching seller:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update seller by admin
exports.updateSellerByAdmin = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const updateData = req.body;

    const seller = await Seller.findByIdAndUpdate(
      sellerId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Seller updated successfully',
      seller
    });
  } catch (error) {
    console.error('Error updating seller:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Delete seller
exports.deleteSeller = async (req, res) => {
  try {
    const { sellerId } = req.params;

    const seller = await Seller.findByIdAndDelete(sellerId);

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Seller deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting seller:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Export sellers to Excel
exports.exportSellersToExcel = async (req, res) => {
  try {
    const { 
      status, 
      search, 
      city, 
      isVerified, 
      dateFrom, 
      dateTo 
    } = req.query;
    
    const filter = {};
    
    // Apply same filters as getAllSellers
    if (status) filter.status = status;
    if (city) filter.city = { $regex: city, $options: 'i' };
    if (isVerified !== undefined) filter.isVerified = isVerified === 'true';
    
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    if (search) {
      filter.$or = [
        { companyName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } },
        { contactNumber: { $regex: search, $options: 'i' } },
        { contactPerson: { $regex: search, $options: 'i' } },
        { gstNumber: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
        { pinCode: { $regex: search, $options: 'i' } }
      ];
    }

    const sellers = await Seller.find(filter)
      .populate('leads', 'createdAt status')
      .sort({ createdAt: -1 });

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sellers');

    // Define columns
    worksheet.columns = [
      { header: 'ID', key: '_id', width: 25 },
      { header: 'Company Name', key: 'companyName', width: 30 },
      { header: 'Contact Person', key: 'contactPerson', width: 25 },
      { header: 'Phone Number', key: 'phoneNumber', width: 15 },
      { header: 'Contact Number', key: 'contactNumber', width: 15 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'City', key: 'city', width: 20 },
      { header: 'Address', key: 'address', width: 40 },
      { header: 'Pin Code', key: 'pinCode', width: 10 },
      { header: 'GST Number', key: 'gstNumber', width: 20 },
      { header: 'Website', key: 'website', width: 30 },
      { header: 'Years in Business', key: 'yearsInBusiness', width: 15 },
      { header: 'Brand Profile Used', key: 'brandOfProfileUsed', width: 25 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Is Verified', key: 'isVerified', width: 12 },
      { header: 'Is Active', key: 'isActive', width: 12 },
      { header: 'Rejection Reason', key: 'rejectionReason', width: 30 },
      { header: 'GST Certificate', key: 'hasGstCertificate', width: 15 },
      { header: 'Visiting Card', key: 'hasVisitingCard', width: 15 },
      { header: 'Business Video', key: 'hasBusinessVideo', width: 15 },
      { header: 'Total Leads', key: 'totalLeads', width: 12 },
      { header: 'Current Quota', key: 'currentQuota', width: 15 },
      { header: 'Used Quota', key: 'usedQuota', width: 12 },
      { header: 'Quota Utilization %', key: 'quotaUtilization', width: 18 },
      { header: 'Registration Date', key: 'createdAt', width: 20 },
      { header: 'Last Updated', key: 'updatedAt', width: 20 }
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Add data rows
    sellers.forEach(seller => {
      const quotaUtilization = seller.freeQuota ? 
        (seller.freeQuota.usedQuota / seller.freeQuota.currentMonthQuota * 100).toFixed(1) : 0;
      
      worksheet.addRow({
        _id: seller._id.toString(),
        companyName: seller.companyName || '',
        contactPerson: seller.contactPerson || '',
        phoneNumber: seller.phoneNumber || '',
        contactNumber: seller.contactNumber || '',
        email: seller.email || '',
        city: seller.city || '',
        address: seller.address || '',
        pinCode: seller.pinCode || '',
        gstNumber: seller.gstNumber || '',
        website: seller.website || '',
        yearsInBusiness: seller.yearsInBusiness || '',
        brandOfProfileUsed: seller.brandOfProfileUsed || '',
        status: seller.status || '',
        isVerified: seller.isVerified ? 'Yes' : 'No',
        isActive: seller.isActive ? 'Yes' : 'No',
        rejectionReason: seller.rejectionReason || '',
        hasGstCertificate: seller.gstCertificate ? 'Yes' : 'No',
        hasVisitingCard: seller.visitingCard ? 'Yes' : 'No',
        hasBusinessVideo: seller.businessProfileVideo ? 'Yes' : 'No',
        totalLeads: seller.leads ? seller.leads.length : 0,
        currentQuota: seller.freeQuota ? seller.freeQuota.currentMonthQuota : 0,
        usedQuota: seller.freeQuota ? seller.freeQuota.usedQuota : 0,
        quotaUtilization: quotaUtilization,
        createdAt: seller.createdAt ? seller.createdAt.toISOString().split('T')[0] : '',
        updatedAt: seller.updatedAt ? seller.updatedAt.toISOString().split('T')[0] : ''
      });
    });

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const filename = `sellers-export-${timestamp}.xlsx`;

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Write to response
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Error exporting sellers to Excel:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting data to Excel',
      error: error.message
    });
  }
};

// Get city statistics
exports.getCityStatistics = async (req, res) => {
  try {
    const cityStats = await Seller.aggregate([
      {
        $group: {
          _id: '$city',
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
          }
        }
      },
      {
        $match: {
          _id: { $ne: null, $ne: '' }
        }
      },
      {
        $sort: { totalSellers: -1 }
      }
    ]);

    // Get overall statistics
    const overallStats = await Seller.aggregate([
      {
        $group: {
          _id: null,
          totalSellers: { $sum: 1 },
          totalCities: { $addToSet: '$city' },
          approvedSellers: {
            $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
          },
          pendingSellers: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          verifiedSellers: {
            $sum: { $cond: ['$isVerified', 1, 0] }
          }
        }
      }
    ]);

    const stats = overallStats[0] || {};
    stats.totalCities = stats.totalCities ? stats.totalCities.filter(city => city && city.trim()).length : 0;

    res.status(200).json({
      success: true,
      cityStatistics: cityStats,
      overallStatistics: stats
    });

  } catch (error) {
    console.error('Error fetching city statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching city statistics',
      error: error.message
    });
  }
};

// Get seller documents details
exports.getSellerDocuments = async (req, res) => {
  try {
    const { sellerId } = req.params;
    
    const seller = await Seller.findById(sellerId).select(
      'companyName gstCertificate visitingCard businessProfileVideo createdAt updatedAt'
    );

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    const documents = {
      gstCertificate: {
        exists: !!seller.gstCertificate,
        path: seller.gstCertificate,
        type: 'GST Certificate'
      },
      visitingCard: {
        exists: !!seller.visitingCard,
        path: seller.visitingCard,
        type: 'Visiting Card'
      },
      businessProfileVideo: {
        exists: !!seller.businessProfileVideo,
        path: seller.businessProfileVideo,
        type: 'Business Profile Video'
      }
    };

    res.status(200).json({
      success: true,
      seller: {
        id: seller._id,
        companyName: seller.companyName
      },
      documents
    });

  } catch (error) {
    console.error('Error fetching seller documents:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching seller documents',
      error: error.message
    });
  }
};