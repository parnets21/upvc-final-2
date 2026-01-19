const express = require('express');
const router = express.Router();
const adminController = require('../../controllers/Seller/sellerController');

// Test endpoint to check sellers
router.get('/test-sellers', async (req, res) => {
  try {
    const Seller = require('../../models/Seller/Seller');
    const count = await Seller.countDocuments({});
    const sellers = await Seller.find({}).limit(5);
    res.json({
      success: true,
      totalCount: count,
      sampleSellers: sellers.map(s => ({
        id: s._id,
        companyName: s.companyName,
        email: s.email,
        phoneNumber: s.phoneNumber,
        status: s.status
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Seller management routes - specific routes first, then parameterized routes
router.get('/sellers/export', adminController.exportSellersToExcel);
router.get('/sellers/statistics/cities', adminController.getCityStatistics);
router.get('/sellers', adminController.getAllSellers);
router.get('/sellers/:sellerId', adminController.getSellerById);
router.get('/sellers/:sellerId/documents', adminController.getSellerDocuments);
router.put('/sellers/:sellerId/approve', adminController.approveSeller);
router.put('/sellers/:sellerId/reject', adminController.rejectSeller);
router.put('/sellers/:sellerId/toggle-status', adminController.toggleSellerStatus);
router.put('/sellers/:sellerId', adminController.updateSellerByAdmin);
router.delete('/sellers/:sellerId', adminController.deleteSeller);

module.exports = router;