const express = require('express');
const router = express.Router();
const transactionController = require('../../controllers/Buyer/transactionController');
const { authenticate } = require('../../middlewares/authMiddleware');
const { authenticateSeller } = require('../../middlewares/sellerAuth');

// Buyer routes - select winner
router.get('/leads/:leadId/transaction', authenticate, transactionController.getLeadTransaction);
router.post('/leads/:leadId/select-winner', authenticate, transactionController.selectWinningSeller);
router.post('/leads/:leadId/decline-seller', authenticate, transactionController.declineSeller);

// Seller routes - confirm/ignore advance payment
router.post('/leads/:leadId/confirm-advance', authenticateSeller, transactionController.sellerConfirmWin);
router.post('/leads/:leadId/ignore-advance', authenticateSeller, transactionController.sellerIgnoreAdvance);
router.get('/leads/:leadId/status', authenticateSeller, transactionController.getSellerLeadStatus);

module.exports = router;
