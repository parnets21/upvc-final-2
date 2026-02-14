const { messaging } = require('../config/firebase');

/**
 * Send notification to a single device
 * @param {string} fcmToken - Device FCM token
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Additional data payload
 */
const sendNotificationToDevice = async (fcmToken, title, body, data = {}) => {
  try {
    const message = {
      notification: {
        title,
        body,
      },
      data: {
        ...data,
        timestamp: Date.now().toString(),
      },
      token: fcmToken,
      android: {
        priority: 'high',
        notification: {
          channelId: 'upvc-default-channel',
          sound: 'default',
          priority: 'high',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    const response = await messaging.send(message);
    console.log('Successfully sent notification:', response);
    return { success: true, messageId: response };
  } catch (error) {
    console.error('Error sending notification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send notification to multiple devices
 * @param {array} fcmTokens - Array of device FCM tokens
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Additional data payload
 */
const sendNotificationToMultipleDevices = async (fcmTokens, title, body, data = {}) => {
  try {
    const message = {
      notification: {
        title,
        body,
      },
      data: {
        ...data,
        timestamp: Date.now().toString(),
      },
      tokens: fcmTokens,
      android: {
        priority: 'high',
        notification: {
          channelId: 'upvc-default-channel',
          sound: 'default',
          priority: 'high',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    const response = await messaging.sendEachForMulticast(message);
    console.log(`Successfully sent ${response.successCount} notifications`);
    console.log(`Failed to send ${response.failureCount} notifications`);
    
    return {
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
      responses: response.responses,
    };
  } catch (error) {
    console.error('Error sending notifications:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send notification to a topic
 * @param {string} topic - Topic name
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Additional data payload
 */
const sendNotificationToTopic = async (topic, title, body, data = {}) => {
  try {
    const message = {
      notification: {
        title,
        body,
      },
      data: {
        ...data,
        timestamp: Date.now().toString(),
      },
      topic: topic,
      android: {
        priority: 'high',
        notification: {
          channelId: 'upvc-default-channel',
          sound: 'default',
          priority: 'high',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    const response = await messaging.send(message);
    console.log('Successfully sent notification to topic:', response);
    return { success: true, messageId: response };
  } catch (error) {
    console.error('Error sending notification to topic:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send document rejection notification to seller
 * @param {string} fcmToken - Seller's FCM token
 * @param {string} documentType - Type of document rejected
 * @param {string} reason - Rejection reason
 */
const sendDocumentRejectionNotification = async (fcmToken, documentType, reason) => {
  const documentNames = {
    gstCertificate: 'GST Certificate',
    visitingCard: 'Visiting Card',
    businessProfileVideo: 'Business Profile Video',
  };

  const title = 'Document Rejected';
  const body = `Your ${documentNames[documentType] || documentType} has been rejected. Reason: ${reason}`;
  
  return await sendNotificationToDevice(fcmToken, title, body, {
    type: 'document_rejection',
    documentType,
    reason,
  });
};

/**
 * Send document approval notification to seller
 * @param {string} fcmToken - Seller's FCM token
 * @param {string} documentType - Type of document approved
 */
const sendDocumentApprovalNotification = async (fcmToken, documentType) => {
  const documentNames = {
    gstCertificate: 'GST Certificate',
    visitingCard: 'Visiting Card',
    businessProfileVideo: 'Business Profile Video',
  };

  const title = 'Document Approved';
  const body = `Your ${documentNames[documentType] || documentType} has been approved!`;
  
  return await sendNotificationToDevice(fcmToken, title, body, {
    type: 'document_approval',
    documentType,
  });
};

/**
 * Send new lead notification to seller
 * @param {string} fcmToken - Seller's FCM token
 * @param {object} leadData - Lead information
 */
const sendNewLeadNotification = async (fcmToken, leadData) => {
  const title = 'New Lead Received!';
  const body = `You have a new lead from ${leadData.buyerName || 'a buyer'} in ${leadData.city || 'your area'}`;
  
  return await sendNotificationToDevice(fcmToken, title, body, {
    type: 'new_lead',
    leadId: leadData.leadId,
    buyerName: leadData.buyerName,
    city: leadData.city,
  });
};

/**
 * Send seller application rejection notification
 * @param {string} fcmToken - Seller's FCM token
 * @param {string} reason - Rejection reason
 */
const sendSellerApplicationRejectionNotification = async (fcmToken, reason) => {
  const title = 'Application Rejected';
  const body = `Your seller application has been rejected. Reason: ${reason}`;
  
  return await sendNotificationToDevice(fcmToken, title, body, {
    type: 'application_rejection',
    reason,
  });
};

/**
 * Send seller application approval notification
 * @param {string} fcmToken - Seller's FCM token
 */
const sendSellerApplicationApprovalNotification = async (fcmToken) => {
  const title = 'Application Approved!';
  const body = 'Congratulations! Your seller application has been approved. You can now start receiving leads.';
  
  return await sendNotificationToDevice(fcmToken, title, body, {
    type: 'application_approval',
  });
};

module.exports = {
  sendNotificationToDevice,
  sendNotificationToMultipleDevices,
  sendNotificationToTopic,
  sendDocumentRejectionNotification,
  sendDocumentApprovalNotification,
  sendNewLeadNotification,
  sendSellerApplicationRejectionNotification,
  sendSellerApplicationApprovalNotification,
};
