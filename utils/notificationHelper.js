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
  const remainingSlots = 3 - (leadData.participatingSellersCount || 0);
  await Notification.create({
    title: '🔔 New Lead Available!',
    message: `A new lead has been posted in ${leadData.location}. Total area: ${leadData.totalSqft} sqft. ${remainingSlots} seller slots available.`,
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


// ─── Seller: Winner Notification ────────────────────────────────────────────

exports.sendSellerWinNotification = async (fcmToken, data) => {
  const { leadId, buyerName, projectLocation, leadValue } = data;
  return sendFCM({
    notification: {
      title: '🎉 Congratulations! You Won!',
      body: `${buyerName} has selected you as the winner for the project in ${projectLocation}. Please confirm to finalize the deal.`,
    },
    data: { 
      type: 'winner_selected', 
      leadId, 
      timestamp: new Date().toISOString() 
    },
    token: fcmToken,
  });
};

exports.saveSellerNotification = async (sellerId, data) => {
  const { leadId, buyerName, projectLocation, leadValue } = data;
  await Notification.create({
    title: '🎉 You Won the Lead!',
    message: `${buyerName} has selected you as the winner for the project in ${projectLocation}. Lead value: ₹${leadValue.toLocaleString('en-IN')}. Please confirm to finalize the deal.`,
    userType: 'seller',
    type: 'winner_selected',
    userId: sellerId,
    userModel: 'Seller',
  });
};

// ─── Buyer: Transaction Confirmed ───────────────────────────────────────────

exports.sendBuyerTransactionConfirmedNotification = async (fcmToken, data) => {
  const { sellerName, projectLocation } = data;
  return sendFCM({
    notification: {
      title: '✅ Transaction Confirmed!',
      body: `${sellerName} has confirmed the deal for your project in ${projectLocation}. The transaction is now finalized.`,
    },
    data: { 
      type: 'transaction_confirmed', 
      timestamp: new Date().toISOString() 
    },
    token: fcmToken,
  });
};

exports.saveBuyerTransactionConfirmedNotification = async (buyerId, data) => {
  const { sellerName, projectLocation } = data;
  await Notification.create({
    title: '✅ Transaction Confirmed!',
    message: `${sellerName} has confirmed the deal for your project in ${projectLocation}. The transaction is now finalized.`,
    userType: 'buyer',
    type: 'transaction_confirmed',
    userId: buyerId,
    userModel: 'User',
  });
};

// ─── Seller: Escrow Refund ──────────────────────────────────────────────────

exports.sendSellerRefundNotification = async (fcmToken, data) => {
  const { refundAmount, projectLocation } = data;
  return sendFCM({
    notification: {
      title: '💰 Escrow Refund Processed',
      body: `Your escrow deposit of ₹${refundAmount.toLocaleString('en-IN')} for the project in ${projectLocation} has been refunded.`,
    },
    data: { 
      type: 'escrow_refund', 
      timestamp: new Date().toISOString() 
    },
    token: fcmToken,
  });
};

exports.saveSellerRefundNotification = async (sellerId, data) => {
  const { refundAmount, projectLocation, gatewayFee } = data;
  await Notification.create({
    title: '💰 Escrow Refund Processed',
    message: `Your escrow deposit for the project in ${projectLocation} has been refunded. Amount: ₹${refundAmount.toLocaleString('en-IN')} (₹${gatewayFee} gateway fee deducted).`,
    userType: 'seller',
    type: 'escrow_refund',
    userId: sellerId,
    userModel: 'Seller',
  });
};

// ─── Seller: Declined Notification ──────────────────────────────────────────

exports.sendSellerDeclineNotification = async (fcmToken, data) => {
  const { projectLocation, buyerName } = data;
  return sendFCM({
    notification: {
      title: '❌ Lead Declined',
      body: `${buyerName} has selected another seller for the project in ${projectLocation}. Your escrow will be refunded soon.`,
    },
    data: { 
      type: 'lead_declined', 
      timestamp: new Date().toISOString() 
    },
    token: fcmToken,
  });
};

exports.saveSellerDeclineNotification = async (sellerId, data) => {
  const { projectLocation, buyerName } = data;
  await Notification.create({
    title: '❌ Lead Declined',
    message: `${buyerName} has selected another seller for the project in ${projectLocation}. Your escrow deposit will be refunded soon.`,
    userType: 'seller',
    type: 'lead_declined',
    userId: sellerId,
    userModel: 'Seller',
  });
};
