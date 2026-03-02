// Script to check FCM tokens in database
const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/Buyer/User');
const Seller = require('../models/Seller/Seller');

async function checkFCMTokens() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to database');

    // Check buyers
    const buyersWithTokens = await User.find({ fcmToken: { $exists: true, $ne: null } }).select('mobileNumber fcmToken createdAt');
    console.log('\n=== BUYERS WITH FCM TOKENS ===');
    console.log(`Total: ${buyersWithTokens.length}`);
    buyersWithTokens.forEach((buyer, index) => {
      console.log(`${index + 1}. Mobile: ${buyer.mobileNumber}, Token: ${buyer.fcmToken?.substring(0, 30)}..., Created: ${buyer.createdAt}`);
    });

    // Check all buyers
    const allBuyers = await User.countDocuments();
    console.log(`\nTotal buyers in database: ${allBuyers}`);

    // Check sellers
    const sellersWithTokens = await Seller.find({ fcmToken: { $exists: true, $ne: null } }).select('mobileNumber fcmToken createdAt');
    console.log('\n=== SELLERS WITH FCM TOKENS ===');
    console.log(`Total: ${sellersWithTokens.length}`);
    sellersWithTokens.forEach((seller, index) => {
      console.log(`${index + 1}. Mobile: ${seller.mobileNumber}, Token: ${seller.fcmToken?.substring(0, 30)}..., Created: ${seller.createdAt}`);
    });

    // Check all sellers
    const allSellers = await Seller.countDocuments();
    console.log(`\nTotal sellers in database: ${allSellers}`);

    mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkFCMTokens();
