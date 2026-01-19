const express = require('express');
const router = express.Router();
const leadController = require('../../controllers/Admin/lead');
const { authenticate } = require('../../middlewares/authMiddleware');
const { authenticateSeller } = require('../../middlewares/sellerAuth');
const Seller = require('../../models/Seller/Seller');

// Get seller's remaining quota
router.get('/quota', authenticateSeller, leadController.getSellerQuota);

// Admin analytics and data endpoints (MUST come before parameterized routes)
router.get('/cities', leadController.getCities);
router.get('/analytics', leadController.getLeadAnalytics);
router.get('/city-analytics', leadController.getCityAnalytics);
router.get('/brand-analytics', leadController.getBrandAnalytics);
router.get('/expired', leadController.getExpiredLeads);
router.get('/comprehensive', leadController.getAllLeadsAdmin);

// City-specific routes
router.get('/city/:city', leadController.getLeadsByCity);

// Check if quota was used for a lead
router.get('/lead-quota-check/:leadId', authenticateSeller, async (req, res) => {
  try {
    const seller = await Seller.findById({_id : req.seller._id});
    const alreadyUsed = seller.quotaUsage.some(u => u.leadId.equals(req.params.leadId));
    res.json({ success: true, alreadyUsed });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Lead management routes
// POST /api/seller/lead - Create a new lead (Buyer side)
router.post('/', authenticate, (req, res, next) => {
  console.log('\n🔵 [ROUTE] POST /api/seller/lead - Route hit!');
  console.log('🔵 [ROUTE] Request received at:', new Date().toISOString());
  console.log('🔵 [ROUTE] User authenticated:', req.user?._id || 'No user');
  next();
}, leadController.createLead);

// GET /api/seller/lead - Get all leads (Seller side)
router.get('/', (req, res, next) => {
  console.log('\n🟢 [ROUTE] GET /api/seller/lead - Route hit!');
  console.log('🟢 [ROUTE] Request received at:', new Date().toISOString());
  console.log('🟢 [ROUTE] Query params:', JSON.stringify(req.query, null, 2));
  console.log('🟢 [ROUTE] Seller authenticated:', req.seller?._id || 'No seller (public access)');
  next();
}, leadController.getAllLeads);

// Comprehensive lead detail endpoints (MUST come before basic /:id route)
router.get('/:id/comprehensive', leadController.getComprehensiveLeadDetails);
router.get('/:id/purchase-history', leadController.getLeadPurchaseHistory);
router.get('/:id/visibility-status', leadController.getLeadVisibilityStatus);
router.get('/:id/timeline', leadController.getLeadTimeline);
router.get('/:id/invoices', leadController.getLeadInvoices);

// Basic lead detail endpoints (fallback)
router.get('/:id/details', leadController.getLeadById);
router.get('/:id/purchases', leadController.getLeadPurchaseHistory);

// Lead management actions
router.put('/:id/extend', leadController.extendLeadExpiry);

// Basic lead operations
router.get('/:id', leadController.getLeadById);
router.post('/purchase', authenticateSeller, leadController.purchaseLead);
router.put('/status', leadController.updateLeadStatus);
router.post('/calculate-price', leadController.calculateLeadPrice);

module.exports = router;