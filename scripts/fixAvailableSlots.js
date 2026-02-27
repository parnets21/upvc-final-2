const mongoose = require('mongoose');
const Lead = require('../models/Admin/lead');
require('dotenv').config();

async function fixAvailableSlots() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find all leads
    const leads = await Lead.find({});
    console.log(`\n📊 Found ${leads.length} leads to check`);

    let fixedCount = 0;

    for (const lead of leads) {
      const sellerCount = lead.seller?.length || 0;
      const correctAvailableSlots = 6 - sellerCount;

      if (lead.availableSlots !== correctAvailableSlots) {
        console.log(`\n🔧 Fixing Lead ${lead._id}:`);
        console.log(`   Current availableSlots: ${lead.availableSlots}`);
        console.log(`   Seller count: ${sellerCount}`);
        console.log(`   Correct availableSlots: ${correctAvailableSlots}`);

        lead.availableSlots = correctAvailableSlots;
        lead.maxSlots = 6;
        await lead.save();

        fixedCount++;
        console.log(`   ✅ Fixed!`);
      }
    }

    console.log(`\n✅ Fixed ${fixedCount} leads`);
    console.log(`✅ ${leads.length - fixedCount} leads were already correct`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixAvailableSlots();
