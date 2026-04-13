const express = require('express');
const router = express.Router();
const transactionController = require('../../controllers/Buyer/transactionController');
const { authenticate } = require('../../middlewares/authMiddleware');
const { authenticateSeller } = require('../../middlewares/sellerAuth');

// Buyer routes - select winner
router.get('/leads/:leadId/transaction', authenticate, transactionController.getLeadTransaction);
router.post('/leads/:leadId/select-winner', authenticate, transactionController.selectWinningSeller);

// Seller routes - confirm win
router.post('/leads/:leadId/confirm-win', authenticateSeller, transactionController.sellerConfirmWin);
router.get('/leads/:leadId/status', authenticateSeller, transactionController.getSellerLeadStatus);

module.exports = router;
