const express = require('express');
const router = express.Router();
const notificationController = require('../../controllers/Admin/notificationController');
const authenticateAdmin = require('../../middlewares/adminAuth');

// Send bulk notification to buyers or sellers (admin only)
router.post('/send', authenticateAdmin, notificationController.sendBulkNotification);

module.exports = router;
