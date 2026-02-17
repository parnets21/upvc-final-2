/**
 * Get Seller FCM Token
 * 
 * This script helps you find sellers with FCM tokens for testing notifications
 * 
 * Usage: node scripts/getSellerFCMToken.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Seller = require('../models/Seller/Seller');

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

async function getSellerTokens() {
  try {
    console.log('\n🔍 Searching for sellers with FCM tokens...\n');

    // Find all sellers with FCM tokens
    const sellers = await Seller.find({ 
      fcmToken: { $exists: true, $ne: null, $ne: '' } 
    })
    .select('_id companyName phoneNumber email fcmToken status createdAt')
    .sort({ createdAt: -1 })
    .limit(10);

    if (sellers.length === 0) {
      console.log('❌ No sellers found with FCM tokens');
      console.log('\n💡 Tips:');
      console.log('   1. Register a new seller from the mobile app');
      console.log('   2. Ensure notification permissions are granted');
      console.log('   3. Check that FCM token is being sent during registration');
      process.exit(0);
    }

    console.log(`✅ Found ${sellers.length} seller(s) with FCM tokens:\n`);
    console.log('═'.repeat(100));

    sellers.forEach((seller, index) => {
      console.log(`\n${index + 1}. ${seller.companyName || 'N/A'}`);
      console.log('   ├─ ID:', seller._id);
      console.log('   ├─ Phone:', seller.phoneNumber);
      console.log('   ├─ Email:', seller.email || 'N/A');
      console.log('   ├─ Status:', seller.status);
      console.log('   ├─ Registered:', seller.createdAt.toLocaleDateString());
      console.log('   └─ FCM Token:', seller.fcmToken.substring(0, 50) + '...');
    });

    console.log('\n' + '═'.repeat(100));
    console.log('\n📋 To test notifications with a seller:');
    console.log('   1. Copy the Seller ID from above');
    console.log('   2. Open scripts/testSellerNotification.js');
    console.log('   3. Update SELLER_ID with the copied ID');
    console.log('   4. Run: node scripts/testSellerNotification.js');

    // Get total count of sellers with and without tokens
    const totalSellers = await Seller.countDocuments();
    const sellersWithTokens = await Seller.countDocuments({ 
      fcmToken: { $exists: true, $ne: null, $ne: '' } 
    });
    const sellersWithoutTokens = totalSellers - sellersWithTokens;

    console.log('\n📊 Statistics:');
    console.log('   ├─ Total Sellers:', totalSellers);
    console.log('   ├─ With FCM Tokens:', sellersWithTokens);
    console.log('   └─ Without FCM Tokens:', sellersWithoutTokens);

    if (sellersWithoutTokens > 0) {
      console.log('\n⚠️  Some sellers don\'t have FCM tokens.');
      console.log('   This means they won\'t receive push notifications.');
      console.log('   They need to update their app or re-register.');
    }

  } catch (error) {
    console.error('\n❌ Error:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed\n');
    process.exit(0);
  }
}

// Run the script
getSellerTokens();
