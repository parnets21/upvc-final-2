const User = require('../../models/Buyer/User');
const Seller = require('../../models/Seller/Seller');
const Notification = require('../../models/Notification');
const { admin } = require('../../config/firebase'); // Use existing Firebase config

// Get notifications for a specific user
exports.getUserNotifications = async (req, res) => {
  try {
    const { userType } = req.params; // 'buyer' or 'seller'
    const userId = req.user?._id; // From auth middleware (optional)

    console.log('=== GET USER NOTIFICATIONS ===');
    console.log('User Type:', userType);
    console.log('User ID:', userId);

    if (!['buyer', 'seller'].includes(userType)) {
      return res.status(400).json({
        success: false,
        message: 'User type must be either "buyer" or "seller"'
      });
    }

    // Get notifications for this user type
    // Include both broadcast notifications (userId: null) and user-specific notifications
    const query = {
      userType: userType,
      $or: [
        { userId: null }, // Broadcast notifications
        { userId: userId } // User-specific notifications
      ]
    };

    console.log('Query:', JSON.stringify(query));

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(50) // Limit to last 50 notifications
      .lean();

    console.log(`Found ${notifications.length} notifications`);

    res.status(200).json({
      success: true,
      notifications: notifications,
      count: notifications.length
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

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

    // Save notification to database for history
    try {
      await Notification.create({
        title: title,
        message: description,
        userType: userType,
        type: 'admin_notification',
        userId: null, // Broadcast to all users
        userModel: userType === 'buyer' ? 'User' : 'Seller'
      });
      console.log('Notification saved to database');
    } catch (dbError) {
      console.error('Error saving notification to database:', dbError);
      // Continue even if database save fails
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

// Send notification to individual user
exports.sendIndividualNotification = async (req, res) => {
  try {
    const { userId, userType, title, description } = req.body;

    // Validate input
    if (!userId || !userType || !title || !description) {
      return res.status(400).json({
        success: false,
        message: 'User ID, user type, title, and description are required'
      });
    }

    if (!['buyer', 'seller'].includes(userType)) {
      return res.status(400).json({
        success: false,
        message: 'User type must be either "buyer" or "seller"'
      });
    }

    // Get the user and their FCM token
    let user;
    if (userType === 'buyer') {
      user = await User.findById(userId).select('fcmToken mobileNumber');
    } else {
      user = await Seller.findById(userId).select('fcmToken mobileNumber');
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: `${userType} not found`
      });
    }

    if (!user.fcmToken) {
      return res.status(400).json({
        success: false,
        message: `${userType} does not have a registered device for notifications`
      });
    }

    console.log(`Sending notification to individual ${userType}: ${user.mobileNumber}`);

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
      },
      token: user.fcmToken
    };

    // Send notification
    try {
      await admin.messaging().send(message);
      console.log('Notification sent successfully');
    } catch (fcmError) {
      console.error('Error sending FCM notification:', fcmError);
      // If token is invalid, clean it up
      if (fcmError.code === 'messaging/invalid-registration-token' || 
          fcmError.code === 'messaging/registration-token-not-registered') {
        if (userType === 'buyer') {
          await User.findByIdAndUpdate(userId, { $unset: { fcmToken: "" } });
        } else {
          await Seller.findByIdAndUpdate(userId, { $unset: { fcmToken: "" } });
        }
      }
      throw fcmError;
    }

    // Save notification to database
    await Notification.create({
      title: title,
      message: description,
      userType: userType,
      type: 'admin_notification',
      userId: userId,
      userModel: userType === 'buyer' ? 'User' : 'Seller'
    });

    res.status(200).json({
      success: true,
      message: 'Notification sent successfully'
    });

  } catch (error) {
    console.error('Error sending individual notification:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};
