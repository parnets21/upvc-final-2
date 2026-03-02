const express = require('express');
const router = express.Router();
const notificationController = require('../../controllers/Admin/notificationController');
const authenticateAdmin = require('../../middlewares/adminAuth');
const { authenticate } = require('../../middlewares/authMiddleware');

// Send bulk notification to buyers or sellers (admin only) - MUST BE FIRST
router.post('/send', authenticateAdmin, notificationController.sendBulkNotification);

// Send notification to individual user (admin only)
router.post('/send-individual', authenticateAdmin, notificationController.sendIndividualNotification);

// Get notifications for buyer/seller (requires user authentication)
router.get('/:userType', authenticate, notificationController.getUserNotifications);

module.exports = router;
