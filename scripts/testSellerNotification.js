/**
 * Test Script for Seller Notifications
 * 
 * This script helps test if notifications are being sent correctly
 * to sellers when their application or documents are rejected/approved.
 * 
 * Usage:
 * 1. Update the SELLER_ID and FCM_TOKEN below
 * 2. Run: node scripts/testSellerNotification.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Seller = require('../models/Seller/Seller');
const {
  sendSellerApplicationRejectionNotification,
  sendSellerApplicationApprovalNotification,
  sendDocumentRejectionNotification,
  sendDocumentApprovalNotification,
} = require('../utils/notificationHelper');

// Configuration
const SELLER_ID = 'PASTE_SELLER_ID_HERE'; // Replace with actual seller ID
const TEST_FCM_TOKEN = 'PASTE_FCM_TOKEN_HERE'; // Replace with actual FCM token

// Connect to database
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

async function testNotifications() {
  console.log('\n🧪 Starting Notification Tests...\n');

  try {
    // Test 1: Get seller from database
    console.log('📋 Test 1: Fetching seller from database...');
    const seller = await Seller.findById(SELLER_ID);
    
    if (!seller) {
      console.error('❌ Seller not found with ID:', SELLER_ID);
      console.log('💡 Tip: Update SELLER_ID in this script with a valid seller ID');
      process.exit(1);
    }
    
    console.log('✅ Seller found:', seller.companyName);
    console.log('📱 FCM Token in DB:', seller.fcmToken ? 'Present' : 'Missing');
    
    if (!seller.fcmToken && !TEST_FCM_TOKEN) {
      console.error('❌ No FCM token found. Please either:');
      console.log('   1. Use a seller that has an FCM token, OR');
      console.log('   2. Set TEST_FCM_TOKEN in this script');
      process.exit(1);
    }

    const fcmToken = seller.fcmToken || TEST_FCM_TOKEN;
    console.log('📱 Using FCM Token:', fcmToken.substring(0, 20) + '...\n');

    // Test 2: Application Rejection Notification
    console.log('📋 Test 2: Sending Application Rejection Notification...');
    const rejectionResult = await sendSellerApplicationRejectionNotification(
      fcmToken,
      'Test rejection reason - incomplete documents'
    );
    
    if (rejectionResult.success) {
      console.log('✅ Application rejection notification sent successfully');
      console.log('   Message ID:', rejectionResult.messageId);
    } else {
      console.error('❌ Failed to send application rejection notification');
      console.error('   Error:', rejectionResult.error);
    }
    
    // Wait 2 seconds before next test
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 3: Application Approval Notification
    console.log('\n📋 Test 3: Sending Application Approval Notification...');
    const approvalResult = await sendSellerApplicationApprovalNotification(fcmToken);
    
    if (approvalResult.success) {
      console.log('✅ Application approval notification sent successfully');
      console.log('   Message ID:', approvalResult.messageId);
    } else {
      console.error('❌ Failed to send application approval notification');
      console.error('   Error:', approvalResult.error);
    }
    
    // Wait 2 seconds before next test
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 4: Document Rejection Notification
    console.log('\n📋 Test 4: Sending Document Rejection Notification...');
    const docRejectionResult = await sendDocumentRejectionNotification(
      fcmToken,
      'gstCertificate',
      'Test rejection - document is not clear'
    );
    
    if (docRejectionResult.success) {
      console.log('✅ Document rejection notification sent successfully');
      console.log('   Message ID:', docRejectionResult.messageId);
    } else {
      console.error('❌ Failed to send document rejection notification');
      console.error('   Error:', docRejectionResult.error);
    }
    
    // Wait 2 seconds before next test
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 5: Document Approval Notification
    console.log('\n📋 Test 5: Sending Document Approval Notification...');
    const docApprovalResult = await sendDocumentApprovalNotification(
      fcmToken,
      'gstCertificate'
    );
    
    if (docApprovalResult.success) {
      console.log('✅ Document approval notification sent successfully');
      console.log('   Message ID:', docApprovalResult.messageId);
    } else {
      console.error('❌ Failed to send document approval notification');
      console.error('   Error:', docApprovalResult.error);
    }

    console.log('\n✅ All notification tests completed!');
    console.log('\n📱 Check your mobile device for notifications.');
    console.log('   - If app is open: Check for Toast notifications');
    console.log('   - If app is closed/background: Check notification tray');
    
  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
}

// Run tests
testNotifications();
