const { admin } = require('../config/firebase');
const Notification = require('../models/Notification');

// Send new lead notification to seller via FCM
exports.sendNewLeadNotification = async (fcmToken, leadData) => {
  try {
    const { leadId, buyerName, city } = leadData;

    const message = {
      notification: {
        title: '🎯 New Lead Available!',
        body: `${buyerName} has posted a new lead in ${city}. Check it out now!`,
      },
      data: {
        type: 'new_lead',
        leadId: leadId,
        timestamp: new Date().toISOString()
      },
      token: fcmToken
    };

    await admin.messaging().send(message);
    console.log('✅ FCM notification sent successfully');
    return true;
  } catch (error) {
    console.error('❌ Error sending FCM notification:', error);
    throw error;
  }
};

// Save notification to database for seller
exports.saveSellerNotification = async (sellerId, leadData) => {
  try {
    await Notification.create({
      title: '🎯 New Lead Available!',
      message: `A new lead has been posted in ${leadData.location}. Total area: ${leadData.totalSqft} sqft. ${leadData.availableSlots} slots available.`,
      userType: 'seller',
      type: 'new_lead',
      userId: sellerId,
      userModel: 'Seller'
    });
    console.log('✅ Notification saved to database');
    return true;
  } catch (error) {
    console.error('❌ Error saving notification to database:', error);
    throw error;
  }
};
