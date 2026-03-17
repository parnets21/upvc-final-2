const { admin } = require('../config/firebase');
const Notification = require('../models/Notification');

// Remove stale FCM token from DB when Firebase says it's no longer registered
const cleanStaleToken = async (fcmToken) => {
  try {
    const Seller = require('../models/Seller/Seller');
    const User = require('../models/Buyer/User');
    await Promise.all([
      Seller.findOneAndUpdate({ fcmToken }, { $unset: { fcmToken: '' } }),
      User.findOneAndUpdate({ fcmToken }, { $unset: { fcmToken: '' } }),
    ]);
    console.warn('⚠️ Stale FCM token removed from DB');
  } catch (e) {
    console.error('Error cleaning stale token:', e.message);
  }
};

const isStaleTokenError = (error) =>
  error.errorInfo?.code === 'messaging/registration-token-not-registered' ||
  error.errorInfo?.code === 'messaging/invalid-registration-token';

// Generic FCM send with stale-token cleanup
const sendFCM = async (message) => {
  try {
    await admin.messaging().send(message);
    return true;
  } catch (error) {
    if (isStaleTokenError(error)) {
      await cleanStaleToken(message.token);
    }
    console.error('FCM send error:', error.message);
    throw error;
  }
};

// ─── Seller: New Lead ────────────────────────────────────────────────────────

exports.sendNewLeadNotification = async (fcmToken, leadData) => {
  const { leadId, buyerName, city } = leadData;
  return sendFCM({
    notification: {
      title: '🎯 New Lead Available!',
      body: `${buyerName} has posted a new lead in ${city}. Check it out now!`,
    },
    data: { type: 'new_lead', leadId, timestamp: new Date().toISOString() },
    token: fcmToken,
  });
};

exports.saveSellerNotification = async (sellerId, leadData) => {
  await Notification.create({
    title: '� New Lead Available!',
    message: `A new lead has been posted in ${leadData.location}. Total area: ${leadData.totalSqft} sqft. ${leadData.availableSlots} slots available.`,
    userType: 'seller',
    type: 'new_lead',
    userId: sellerId,
    userModel: 'Seller',
  });
};

// ─── Buyer: Lead Purchased ───────────────────────────────────────────────────

exports.sendBuyerLeadPurchasedNotification = async (fcmToken, data) => {
  const title = '🎉 Your lead is getting attention!';
  const body = data.remainingSlots === 0
    ? `A fabricator in ${data.location} just unlocked your project. Your lead is now fully booked!`
    : `A fabricator in ${data.location} just unlocked your project. ${data.remainingSlots} slot(s) still open!`;
  return sendFCM({
    notification: { title, body },
    data: { type: 'lead_purchased', leadId: data.leadId, timestamp: new Date().toISOString() },
    token: fcmToken,
  });
};

exports.saveBuyerNotification = async (buyerId, data) => {
  const title = '🎉 Your lead is getting attention!';
  const message = data.remainingSlots === 0
    ? `A fabricator in ${data.location} just unlocked your project. Your lead is now fully booked!`
    : `A fabricator in ${data.location} just unlocked your project. ${data.remainingSlots} slot(s) still open!`;
  await Notification.create({
    title, message, userType: 'buyer', type: 'lead_purchased',
    userId: buyerId, userModel: 'User',
  });
};

// ─── Seller: Account Approval / Rejection ───────────────────────────────────

exports.sendSellerApplicationApprovalNotification = async (fcmToken) => {
  return sendFCM({
    notification: {
      title: '🎉 Account Approved!',
      body: 'Congratulations! Your account has been approved. You can now access leads and start growing your business.',
    },
    data: { type: 'application_approval', timestamp: new Date().toISOString() },
    token: fcmToken,
  });
};

exports.sendSellerApplicationRejectionNotification = async (fcmToken, reason) => {
  return sendFCM({
    notification: {
      title: '❌ Application Not Approved',
      body: `Your application was not approved. Reason: ${reason}`,
    },
    data: { type: 'application_rejection', timestamp: new Date().toISOString() },
    token: fcmToken,
  });
};

// ─── Seller: Document Approval / Rejection ───────────────────────────────────

exports.sendDocumentApprovalNotification = async (fcmToken, documentType) => {
  return sendFCM({
    notification: {
      title: '✅ Document Approved',
      body: `Your ${documentType} has been approved.`,
    },
    data: { type: 'document_approval', documentType: documentType || '', timestamp: new Date().toISOString() },
    token: fcmToken,
  });
};

exports.sendDocumentRejectionNotification = async (fcmToken, documentType, reason) => {
  return sendFCM({
    notification: {
      title: '❌ Document Rejected',
      body: `Your ${documentType} was rejected. Reason: ${reason}`,
    },
    data: { type: 'document_rejection', documentType: documentType || '', timestamp: new Date().toISOString() },
    token: fcmToken,
  });
};
