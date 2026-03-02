const User = require('../../models/Buyer/User');
const Seller = require('../../models/Seller/Seller');
const { admin } = require('../../config/firebase'); // Use existing Firebase config

// Send push notification to all buyers or sellers
exports.sendBulkNotification = async (req, res) => {
  try {
    const { userType, title, description } = req.body;

    // Validate input
    if (!userType || !title || !description) {
      return res.status(400).json({
        success: false,
        message: 'User type, title, and description are required'
      });
    }

    if (!['buyer', 'seller'].includes(userType)) {
      return res.status(400).json({
        success: false,
        message: 'User type must be either "buyer" or "seller"'
      });
    }

    let users;
    let fcmTokens = [];

    // Get all users based on type
    if (userType === 'buyer') {
      users = await User.find({ fcmToken: { $exists: true, $ne: null } }).select('fcmToken');
      fcmTokens = users.map(user => user.fcmToken).filter(token => token);
    } else {
      users = await Seller.find({ fcmToken: { $exists: true, $ne: null } }).select('fcmToken');
      fcmTokens = users.map(seller => seller.fcmToken).filter(token => token);
    }

    // Remove duplicate FCM tokens (in case same user has multiple entries or same token)
    fcmTokens = [...new Set(fcmTokens)];

    if (fcmTokens.length === 0) {
      return res.status(200).json({
        success: false,
        message: `No ${userType}s found with FCM tokens. Users need to log in to the app to receive notifications.`,
        sentCount: 0,
        totalUsers: 0
      });
    }

    console.log(`Sending notification to ${fcmTokens.length} unique ${userType}(s)`);

    // Prepare notification payload
    const message = {
      notification: {
        title: title,
        body: description,
      },
      data: {
        type: 'admin_notification',
        userType: userType,
        timestamp: new Date().toISOString()
      }
    };

    // Send notifications in batches (FCM allows max 500 tokens per request)
    const batchSize = 500;
    let successCount = 0;
    let failureCount = 0;
    const failedTokens = [];

    for (let i = 0; i < fcmTokens.length; i += batchSize) {
      const batch = fcmTokens.slice(i, i + batchSize);
      
      try {
        const response = await admin.messaging().sendEachForMulticast({
          tokens: batch,
          ...message
        });

        successCount += response.successCount;
        failureCount += response.failureCount;

        // Collect failed tokens for cleanup
        if (response.failureCount > 0) {
          response.responses.forEach((resp, idx) => {
            if (!resp.success) {
              failedTokens.push(batch[idx]);
            }
          });
        }
      } catch (error) {
        console.error('Error sending batch:', error);
        failureCount += batch.length;
      }
    }

    // Optional: Clean up invalid tokens from database
    if (failedTokens.length > 0) {
      console.log(`Cleaning up ${failedTokens.length} invalid FCM tokens`);
      if (userType === 'buyer') {
        await User.updateMany(
          { fcmToken: { $in: failedTokens } },
          { $unset: { fcmToken: "" } }
        );
      } else {
        await Seller.updateMany(
          { fcmToken: { $in: failedTokens } },
          { $unset: { fcmToken: "" } }
        );
      }
    }

    res.status(200).json({
      success: true,
      message: 'Notifications sent successfully',
      sentCount: successCount,
      failedCount: failureCount,
      totalUsers: fcmTokens.length
    });

  } catch (error) {
    console.error('Error sending bulk notification:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};
