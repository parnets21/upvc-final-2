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

// Send lead purchased notification to buyer via FCM
exports.sendBuyerLeadPurchasedNotification = async (fcmToken, data) => {
  try {
    const title = '🎉 Your lead is getting attention!';
    const body = data.remainingSlots === 0
      ? `A fabricator in ${data.location} just unlocked your project. Your lead is now fully booked!`
      : `A fabricator in ${data.location} just unlocked your project. ${data.remainingSlots} slot(s) still open!`;

    const message = {
      notification: { title, body },
      data: {
        type: 'lead_purchased',
        leadId: data.leadId,
        timestamp: new Date().toISOString()
      },
      token: fcmToken
    };

    await admin.messaging().send(message);
    console.log('✅ Buyer FCM notification sent successfully');
    return true;
  } catch (error) {
    console.error('❌ Error sending buyer FCM notification:', error);
    throw error;
  }
};

// Save lead purchased notification to database for buyer
exports.saveBuyerNotification = async (buyerId, data) => {
  try {
    const title = '🎉 Your lead is getting attention!';
    const message = data.remainingSlots === 0
      ? `A fabricator in ${data.location} just unlocked your project. Your lead is now fully booked!`
      : `A fabricator in ${data.location} just unlocked your project. ${data.remainingSlots} slot(s) still open!`;

    await Notification.create({
      title,
      message,
      userType: 'buyer',
      type: 'lead_purchased',
      userId: buyerId,
      userModel: 'User'
    });
    console.log('✅ Buyer notification saved to database');
    return true;
  } catch (error) {
    console.error('❌ Error saving buyer notification:', error);
    throw error;
  }
};

// Send approval notification to seller
exports.sendSellerApplicationApprovalNotification = async (fcmToken) => {
  try {
    const message = {
      notification: {
        title: '🎉 Account Approved!',
        body: 'Congratulations! Your account has been approved. You can now access leads and start growing your business.',
      },
      data: {
        type: 'application_approval',
        timestamp: new Date().toISOString()
      },
      token: fcmToken
    };
    await admin.messaging().send(message);
    console.log('✅ Seller approval FCM notification sent');
    return true;
  } catch (error) {
    console.error('❌ Error sending seller approval notification:', error);
    throw error;
  }
};

// Send rejection notification to seller
exports.sendSellerApplicationRejectionNotification = async (fcmToken, reason) => {
  try {
    const message = {
      notification: {
        title: '❌ Application Not Approved',
        body: `Your application was not approved. Reason: ${reason}`,
      },
      data: {
        type: 'application_rejection',
        timestamp: new Date().toISOString()
      },
      token: fcmToken
    };
    await admin.messaging().send(message);
    console.log('✅ Seller rejection FCM notification sent');
    return true;
  } catch (error) {
    console.error('❌ Error sending seller rejection notification:', error);
    throw error;
  }
};

// Send document approval notification to seller
exports.sendDocumentApprovalNotification = async (fcmToken, documentType) => {
  try {
    const message = {
      notification: {
        title: '✅ Document Approved',
        body: `Your ${documentType} has been approved.`,
      },
      data: {
        type: 'document_approval',
        documentType: documentType || '',
        timestamp: new Date().toISOString()
      },
      token: fcmToken
    };
    await admin.messaging().send(message);
    return true;
  } catch (error) {
    console.error('❌ Error sending document approval notification:', error);
    throw error;
  }
};

// Send document rejection notification to seller
exports.sendDocumentRejectionNotification = async (fcmToken, documentType, reason) => {
  try {
    const message = {
      notification: {
        title: '❌ Document Rejected',
        body: `Your ${documentType} was rejected. Reason: ${reason}`,
      },
      data: {
        type: 'document_rejection',
        documentType: documentType || '',
        timestamp: new Date().toISOString()
      },
      token: fcmToken
    };
    await admin.messaging().send(message);
    return true;
  } catch (error) {
    console.error('❌ Error sending document rejection notification:', error);
    throw error;
  }
};
