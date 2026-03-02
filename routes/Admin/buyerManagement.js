const express = require('express');
const router = express.Router();
const buyerController = require('../../controllers/Admin/buyerController');
const { authenticate } = require('../../middlewares/authMiddleware');

// Buyer management routes (admin only)
router.get('/buyers', buyerController.getAllBuyers);
router.get('/buyers/:buyerId', buyerController.getBuyerById);
router.put('/buyers/:buyerId', buyerController.updateBuyer);
router.delete('/buyers/:buyerId', buyerController.deleteBuyer);

// Buyer FCM token update (requires buyer authentication)
router.post('/buyers/update-fcm-token', authenticate, buyerController.updateBuyerFCMToken);

module.exports = router;















